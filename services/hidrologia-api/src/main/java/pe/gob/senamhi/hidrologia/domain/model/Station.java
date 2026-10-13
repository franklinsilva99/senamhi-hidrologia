package pe.gob.senamhi.hidrologia.domain.model;

import jakarta.persistence.Column;
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

import java.util.List;

/**
 * Ficha de estación hidrológica. El campo {@code codigo} es la clave de negocio
 * (el {@code id} del PoC, p. ej. "socsi"); {@code id} es el PK numérico interno.
 */
@Entity
@Table(name = "station")
@Getter
@Setter
@NoArgsConstructor
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", unique = true, nullable = false)
    private String codigo;

    private Integer n;
    private String cuenca;
    private String estacion;
    private String rio;
    private String codigoAuto;
    private String codigoConvencional;
    private String dz;
    private String escalaTemporal;
    private String region;
    private Double lat;
    private Double lon;
    private Boolean isEstimated;
    private String fuente;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> poblados;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<PobladoGeo> pobladosGeo;

    @JdbcTypeCode(SqlTypes.JSON)
    private Object polygon;

    private String departamento;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> provincia;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> distritos;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> variables;

    @Enumerated(EnumType.STRING)
    private Variable preferencia;

    @Enumerated(EnumType.STRING)
    private TipoAviso tipo;

    @Enumerated(EnumType.STRING)
    private ModoPublicacion modoPublicacion;

    private String estado;

    private Double cota;
    private String cotaFuente;
}
