package pe.gob.senamhi.hidrologia.domain.service;

import org.springframework.stereotype.Service;
import pe.gob.senamhi.hidrologia.domain.model.ConfigRecord;
import pe.gob.senamhi.hidrologia.domain.model.DeteccionAviso;
import pe.gob.senamhi.hidrologia.domain.model.NivelAlerta;
import pe.gob.senamhi.hidrologia.domain.model.ObservationView;
import pe.gob.senamhi.hidrologia.domain.model.Station;
import pe.gob.senamhi.hidrologia.domain.model.TipoAviso;
import pe.gob.senamhi.hidrologia.domain.model.Umbrales;
import pe.gob.senamhi.hidrologia.domain.model.Variable;

import java.util.List;
import java.util.Map;

/**
 * Clasifica el último dato de cada estación contra sus umbrales (port de
 * {@code lib/domain/deteccion.ts}). Compara el valor RELATIVO (sin cota); la cota
 * solo se suma para mostrar m.s.n.m. ({@code valorAbsoluto}).
 */
@Service
public class DeteccionService {

    private final ConfigRecordService configRecordService;
    private final UmbralService umbralService;

    public DeteccionService(ConfigRecordService configRecordService, UmbralService umbralService) {
        this.configRecordService = configRecordService;
        this.umbralService = umbralService;
    }

    public List<DeteccionAviso> detectarAvisos(
            List<Station> stations,
            Map<String, ObservationView> latest,
            String fecha) {
        return stations.stream().map(s -> detectar(s, latest, fecha)).toList();
    }

    public DeteccionAviso detectar(Station s, Map<String, ObservationView> latest, String fecha) {
        ObservationView obs = latest.get(s.getCodigo());
        Variable preferencia = s.getPreferencia() != null ? s.getPreferencia() : Variable.CAUDAL;
        TipoAviso tipo = s.getTipo() != null ? s.getTipo() : TipoAviso.AVENIDA;
        ConfigRecord record = configRecordService.vigente(s.getCodigo(), preferencia, fecha);

        if (obs == null || record == null || record.getUmbrales() == null) {
            return DeteccionAviso.builder()
                    .stationId(s.getCodigo())
                    .valorActual(0.0)
                    .umbral(null)
                    .preferencia(preferencia)
                    .tipo(tipo)
                    .excedido(false)
                    .build();
        }

        double valorActual = preferencia == Variable.CAUDAL ? nvl(obs.getCaudal()) : nvl(obs.getNivel());
        Umbrales u = tipo == TipoAviso.AVENIDA
                ? record.getUmbrales().getAvenida()
                : record.getUmbrales().getVigilancia();
        NivelAlerta umbral = umbralService.clasificarNivel(valorActual, u, tipo);

        Double valorAbsoluto = (preferencia == Variable.NIVEL && s.getCota() != null && obs.getNivel() != null)
                ? obs.getNivel() + s.getCota()
                : valorActual;

        return DeteccionAviso.builder()
                .stationId(s.getCodigo())
                .valorActual(valorActual)
                .valorAbsoluto(valorAbsoluto)
                .umbral(umbral)
                .preferencia(preferencia)
                .tipo(tipo)
                .excedido(umbral != null)
                .build();
    }

    private double nvl(Double v) {
        return v == null ? 0.0 : v;
    }
}
