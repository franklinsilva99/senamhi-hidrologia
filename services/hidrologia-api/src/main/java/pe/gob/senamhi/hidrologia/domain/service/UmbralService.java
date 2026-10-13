package pe.gob.senamhi.hidrologia.domain.service;

import org.springframework.stereotype.Service;
import pe.gob.senamhi.hidrologia.domain.model.NivelAlerta;
import pe.gob.senamhi.hidrologia.domain.model.TipoAviso;
import pe.gob.senamhi.hidrologia.domain.model.Umbrales;

/**
 * Clasificación de un valor contra un conjunto de umbrales.
 * Única fuente de verdad de la regla de umbrales (port de {@code lib/domain/umbrales.ts}).
 *
 * <ul>
 *   <li>avenida → mayor valor = mayor severidad</li>
 *   <li>vigilancia → menor valor = mayor severidad</li>
 * </ul>
 */
@Service
public class UmbralService {

    public NivelAlerta clasificarNivel(double valor, Umbrales u, TipoAviso tipo) {
        if (u == null) {
            return null;
        }
        if (tipo == TipoAviso.VIGILANCIA) {
            if (valor <= u.getRoja()) {
                return NivelAlerta.ROJO;
            }
            if (valor <= u.getNaranja()) {
                return NivelAlerta.NARANJA;
            }
            if (valor <= u.getAmarilla()) {
                return NivelAlerta.AMARILLO;
            }
            return null;
        }
        if (valor >= u.getRoja()) {
            return NivelAlerta.ROJO;
        }
        if (valor >= u.getNaranja()) {
            return NivelAlerta.NARANJA;
        }
        if (valor >= u.getAmarilla()) {
            return NivelAlerta.AMARILLO;
        }
        return null;
    }
}
