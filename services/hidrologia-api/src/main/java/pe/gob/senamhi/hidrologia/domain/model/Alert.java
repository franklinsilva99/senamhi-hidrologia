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
 * Aviso hidrológico. Un aviso publicado es un snapshot congelado
 * ({@code serie} y {@code umbrales}); no se recalcula.
 */
@Entity
@Table(name = "alert")
@Getter
@Setter
@NoArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer nro;
    private String ca;
    private String ce;
    private String stationId;

    private String titulo;
    private String cuerpoAgua;
    private String distrito;

    private String inicio;
    private String fin;
    private Integer duracionHoras;

    @Enumerated(EnumType.STRING)
    private NivelAlerta nivel;

    private String plazo;
    private Boolean vigente;
    private String fechaEmision;

    @Column(length = 4000)
    private String descripcion;

    @Column(length = 2000)
    private String recomendaciones;

    private Boolean validadoDZ;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> poblados;

    private Double caudalActual;
    private Double nivelActual;

    @Enumerated(EnumType.STRING)
    private Variable preferencia;

    @Enumerated(EnumType.STRING)
    private TipoAviso tipo;

    private Double cota;

    @JdbcTypeCode(SqlTypes.JSON)
    private Umbrales umbrales;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<ObservationView> serie;
}
