package pe.gob.senamhi.hidrologia.web;

import pe.gob.senamhi.hidrologia.domain.model.Variable;

/** Cuerpos de petición de los endpoints de escritura. */
public final class Requests {

    private Requests() {
    }

    /** Ingesta de una lectura de una variable. */
    public record Lectura(String fecha, Variable variable, Double valor) {
    }

    /** Publicación manual: estación a procesar. */
    public record Publish(String stationId) {
    }

    /** Parche de un aviso: habilitar/deshabilitar y/o validar DZ. */
    public record AlertPatch(Boolean vigente, Boolean validadoDZ) {
    }
}
