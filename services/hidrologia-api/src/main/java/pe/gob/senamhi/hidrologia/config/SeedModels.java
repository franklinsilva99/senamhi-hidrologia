package pe.gob.senamhi.hidrologia.config;

import pe.gob.senamhi.hidrologia.domain.model.ModoPublicacion;
import pe.gob.senamhi.hidrologia.domain.model.PobladoGeo;
import pe.gob.senamhi.hidrologia.domain.model.TipoAviso;
import pe.gob.senamhi.hidrologia.domain.model.Variable;

import java.util.List;

/**
 * DTOs de siembra: reflejan EXACTAMENTE la forma de los JSON del PoC.
 * Solo {@code Station} y {@code Cota} los necesitan; el resto de entidades
 * se deserializa directo (sus campos coinciden con el JSON).
 */
public final class SeedModels {

    private SeedModels() {
    }

    public record Station(
            String id,
            Integer n,
            String cuenca,
            String estacion,
            String rio,
            String codigoAuto,
            String codigoConvencional,
            String dz,
            String escalaTemporal,
            String region,
            Double lat,
            Double lon,
            Boolean isEstimated,
            String fuente,
            List<String> poblados,
            List<PobladoGeo> pobladosGeo,
            Object polygon,
            String departamento,
            List<String> provincia,
            List<String> distritos,
            List<String> variables,
            Variable preferencia,
            TipoAviso tipo,
            ModoPublicacion modoPublicacion,
            String estado) {
    }

    public record Cota(String stationId, Double cota, String cotaFuente) {
    }
}
