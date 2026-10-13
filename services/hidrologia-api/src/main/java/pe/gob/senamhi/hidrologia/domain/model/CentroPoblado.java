package pe.gob.senamhi.hidrologia.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Catálogo de centros poblados afectados. En el PoC están desnormalizados en la
 * estación ({@code poblados}/{@code pobladosGeo}); aquí se extraen a catálogo propio.
 */
@Entity
@Table(name = "centro_poblado")
@Getter
@Setter
@NoArgsConstructor
public class CentroPoblado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private Double lat;
    private Double lon;
    private String distrito;
    private String provincia;
    private String departamento;

    /** Estación a la que se asocia (opcional en el PoC). */
    private String stationId;
}
