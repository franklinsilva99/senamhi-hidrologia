package pe.gob.senamhi.hidrologia.domain.service;

import org.springframework.stereotype.Service;
import pe.gob.senamhi.hidrologia.domain.model.Lectura;
import pe.gob.senamhi.hidrologia.domain.model.ObservationView;
import pe.gob.senamhi.hidrologia.domain.model.Station;
import pe.gob.senamhi.hidrologia.domain.model.Variable;
import pe.gob.senamhi.hidrologia.domain.repository.LecturaRepository;
import pe.gob.senamhi.hidrologia.domain.repository.StationRepository;

import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Fusiona las series por variable (nivel + caudal) en una serie unida de
 * {@link ObservationView}, como lo hace el PoC al leer.
 */
@Service
public class ObservacionService {

    private static final int VENTANA_HORAS = 72;

    private final LecturaRepository lecturaRepository;
    private final StationRepository stationRepository;

    public ObservacionService(LecturaRepository lecturaRepository, StationRepository stationRepository) {
        this.lecturaRepository = lecturaRepository;
        this.stationRepository = stationRepository;
    }

    /** Serie fusionada de una estación, opcionalmente recortada a la ventana. */
    public List<ObservationView> serieFusionada(String stationId, Integer horas) {
        List<Lectura> lecturas = lecturaRepository.findByStationIdOrderByFechaAsc(stationId);
        List<ObservationView> merged = merge(stationId, lecturas);
        if (horas != null && horas > 0 && merged.size() > horas) {
            return new ArrayList<>(merged.subList(merged.size() - horas, merged.size()));
        }
        return merged;
    }

    private List<ObservationView> merge(String stationId, List<Lectura> lecturas) {
        Map<String, Double> nivel = new TreeMap<>();
        Map<String, Double> caudal = new TreeMap<>();
        for (Lectura l : lecturas) {
            if (l.getVariable() == Variable.NIVEL) {
                nivel.put(l.getFecha(), l.getValor());
            } else if (l.getVariable() == Variable.CAUDAL) {
                caudal.put(l.getFecha(), l.getValor());
            }
        }
        TreeSet<String> fechas = new TreeSet<>();
        fechas.addAll(nivel.keySet());
        fechas.addAll(caudal.keySet());

        List<ObservationView> out = new ArrayList<>();
        for (String f : fechas) {
            Double n = nivel.get(f);
            Double c = caudal.get(f);
            if (n == null || c == null) {
                continue;
            }
            out.add(new ObservationView(stationId, f, n, c));
        }
        return out;
    }

    /** Última lectura de todas las estaciones (para el mapa). */
    public Map<String, ObservationView> latest() {
        Map<String, ObservationView> map = new HashMap<>();
        for (Station s : stationRepository.findAll()) {
            List<ObservationView> serie = serieFusionada(s.getCodigo(), VENTANA_HORAS);
            if (!serie.isEmpty()) {
                map.put(s.getCodigo(), serie.get(serie.size() - 1));
            }
        }
        return map;
    }

    /** Última lectura de una estación. */
    public ObservationView latest(String stationId) {
        List<ObservationView> serie = serieFusionada(stationId, VENTANA_HORAS);
        return serie.isEmpty() ? null : serie.get(serie.size() - 1);
    }

    /** Caudal promedio diario (fecha -> promedio), desde la serie completa. */
    public Map<String, Double> caudalPromedioDiario(String stationId) {
        Map<String, DoubleSummaryStatistics> porDia = new HashMap<>();
        for (ObservationView o : serieFusionada(stationId, null)) {
            String dia = o.getFecha().substring(0, 10);
            porDia.computeIfAbsent(dia, k -> new DoubleSummaryStatistics()).accept(o.getCaudal());
        }
        Map<String, Double> out = new TreeMap<>();
        porDia.forEach((dia, s) -> out.put(dia, Math.round(s.getAverage() * 10) / 10.0));
        return out;
    }
}
