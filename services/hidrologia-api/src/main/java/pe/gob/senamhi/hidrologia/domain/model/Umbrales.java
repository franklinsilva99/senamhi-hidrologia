package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Umbrales por nivel de alerta (amarilla/naranja/roja). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Umbrales {
    private Double amarilla;
    private Double naranja;
    private Double roja;
}
