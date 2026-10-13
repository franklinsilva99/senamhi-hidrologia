package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Pronóstico diario (promedio de modelos) para una estación/fecha. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastDiario {
    private String stationId;
    private String fecha;
    private Double caudalPrevisto;
    private Integer nModelos;
    private List<String> modelos;
    private String precision;
}
