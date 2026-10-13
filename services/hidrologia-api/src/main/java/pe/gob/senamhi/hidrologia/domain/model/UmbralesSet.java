package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Umbrales por tipo. Una estación puede tener uno o ambos sets
 * (avenida y/o vigilancia). El que no corresponda se serializa como null.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UmbralesSet {
    private Umbrales avenida;
    private Umbrales vigilancia;
}
