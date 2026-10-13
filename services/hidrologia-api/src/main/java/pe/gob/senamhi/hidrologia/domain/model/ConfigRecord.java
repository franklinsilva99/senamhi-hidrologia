package pe.gob.senamhi.hidrologia.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Tabla de configuración: umbrales + vigencia por (estación, variable, periodo).
 * {@code periodo.fin == null} = vigente.
 */
@Entity
@Table(name = "config_record")
@Getter
@Setter
@NoArgsConstructor
public class ConfigRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stationId;

    @Enumerated(EnumType.STRING)
    private Variable variable;

    @JdbcTypeCode(SqlTypes.JSON)
    private Periodo periodo;

    @JdbcTypeCode(SqlTypes.JSON)
    private UmbralesSet umbrales;

    @JdbcTypeCode(SqlTypes.JSON)
    private TiempoVigenciaHrs tiempoVigenciaHrs;
}
