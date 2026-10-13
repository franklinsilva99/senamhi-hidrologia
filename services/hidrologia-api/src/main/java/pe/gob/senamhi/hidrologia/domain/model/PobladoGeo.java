package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Centro poblado con coordenadas (desnormalizado en la estación, en el PoC). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PobladoGeo {
    private String nombre;
    private Double lat;
    private Double lon;
}
