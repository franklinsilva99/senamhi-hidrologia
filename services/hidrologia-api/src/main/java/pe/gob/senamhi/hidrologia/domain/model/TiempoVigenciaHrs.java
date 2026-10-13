package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Tiempo de vigencia (horas) por nivel de alerta. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TiempoVigenciaHrs {
    private Integer amarilla;
    private Integer naranja;
    private Integer roja;
}
