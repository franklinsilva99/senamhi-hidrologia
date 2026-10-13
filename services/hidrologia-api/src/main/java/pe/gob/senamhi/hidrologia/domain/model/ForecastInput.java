package pe.gob.senamhi.hidrologia.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un modelo de pronóstico ingresado por la DZ para una estación/fecha. */
@Entity
@Table(name = "forecast_input")
@Getter
@Setter
@NoArgsConstructor
public class ForecastInput {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stationId;

    /** Formato "yyyy-MM-dd". */
    private String fecha;

    private String modelo;
    private Double valor;
    private String usuario;

    /** Primer día pronosticado del grupo de 3 días al que pertenece esta fecha. */
    private String padre;
}
