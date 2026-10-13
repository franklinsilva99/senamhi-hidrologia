package pe.gob.senamhi.hidrologia.domain.service;

import org.springframework.stereotype.Service;
import pe.gob.senamhi.hidrologia.domain.model.ForecastDiario;
import pe.gob.senamhi.hidrologia.domain.model.ForecastInput;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Regla de pronóstico diario (port de {@code lib/domain/pronostico.ts}):
 * 0 modelos → omitir; 1 → ese valor; 2+ → promedio aritmético.
 */
@Service
public class PronosticoService {

    public static final String PRECISION = "reducida-contingencia";

    public List<ForecastDiario> buildForecastDiario(List<ForecastInput> inputs) {
        Map<String, List<ForecastInput>> byKey = new LinkedHashMap<>();
        for (ForecastInput f : inputs) {
            String k = f.getStationId() + "|" + f.getFecha();
            byKey.computeIfAbsent(k, x -> new ArrayList<>()).add(f);
        }

        List<ForecastDiario> out = new ArrayList<>();
        for (Map.Entry<String, List<ForecastInput>> e : byKey.entrySet()) {
            List<ForecastInput> list = e.getValue();
            if (list.isEmpty()) {
                continue;
            }
            String[] parts = e.getKey().split("\\|", 2);
            double sum = list.stream().mapToDouble(f -> f.getValor() == null ? 0.0 : f.getValor()).sum();
            double avg = sum / list.size();

            out.add(ForecastDiario.builder()
                    .stationId(parts[0])
                    .fecha(parts[1])
                    .caudalPrevisto(Math.round(avg * 10) / 10.0)
                    .nModelos(list.size())
                    .modelos(list.stream().map(ForecastInput::getModelo).toList())
                    .precision(PRECISION)
                    .build());
        }

        out.sort(Comparator.comparing(ForecastDiario::getStationId)
                .thenComparing(ForecastDiario::getFecha));
        return out;
    }
}
