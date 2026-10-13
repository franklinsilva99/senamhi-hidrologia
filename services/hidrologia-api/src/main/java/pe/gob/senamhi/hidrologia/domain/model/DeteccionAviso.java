package pe.gob.senamhi.hidrologia.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Resultado de la clasificación de una estación contra sus umbrales (lectura). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeteccionAviso {
    private String stationId;
    private Double valorActual;
    private Double valorAbsoluto;
    private NivelAlerta umbral;
    private Variable preferencia;
    private TipoAviso tipo;
    private Boolean excedido;
}
