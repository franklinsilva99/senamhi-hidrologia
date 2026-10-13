package pe.gob.senamhi.hidrologia.domain.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Tipo de aviso.
 * <ul>
 *   <li>avenida → mayor valor = mayor severidad (incremento)</li>
 *   <li>vigilancia → menor valor = mayor severidad (descenso)</li>
 * </ul>
 */
public enum TipoAviso {
    AVENIDA("avenida"),
    VIGILANCIA("vigilancia");

    private final String value;

    TipoAviso(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static TipoAviso from(String value) {
        for (TipoAviso t : values()) {
            if (t.value.equals(value)) {
                return t;
            }
        }
        throw new IllegalArgumentException("TipoAviso inválido: " + value);
    }
}
