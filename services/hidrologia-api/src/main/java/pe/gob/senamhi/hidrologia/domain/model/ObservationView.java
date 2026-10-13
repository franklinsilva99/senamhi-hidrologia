package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lectura horaria unida (nivel + caudal por fecha). Es un modelo de LECTURA
 * (no se persiste como tal): se deriva al fusionar las series por variable.
 * También se usa como elemento del snapshot {@code Alert.serie}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ObservationView {
    private String stationId;
    private String fecha;
    private Double nivel;
    private Double caudal;
}
