package pe.gob.senamhi.hidrologia.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Periodo de vigencia de un registro de configuración.
 * {@code final == null} significa "abierto hacia adelante" (vigente).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Periodo {
    private String inicio;

    @JsonProperty("final")
    private String fin;
}
