package pe.gob.senamhi.hidrologia.domain.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Variable de medición de una estación. */
public enum Variable {
    CAUDAL("caudal"),
    NIVEL("nivel");

    private final String value;

    Variable(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static Variable from(String value) {
        for (Variable v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Variable inválida: " + value);
    }
}
