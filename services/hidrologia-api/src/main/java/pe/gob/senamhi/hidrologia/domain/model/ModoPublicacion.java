package pe.gob.senamhi.hidrologia.domain.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Modo de publicación de avisos por estación. */
public enum ModoPublicacion {
    AUTOMATICO("automatico"),
    MANUAL("manual");

    private final String value;

    ModoPublicacion(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static ModoPublicacion from(String value) {
        for (ModoPublicacion m : values()) {
            if (m.value.equals(value)) {
                return m;
            }
        }
        throw new IllegalArgumentException("ModoPublicacion inválido: " + value);
    }
}
