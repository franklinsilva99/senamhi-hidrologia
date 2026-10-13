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

/**
 * Una lectura de UNA variable (caudal o nivel) en un instante.
 * Equivale a una fila de {@code nivel.json} / {@code caudal.json} del PoC.
 * La serie fusionada (nivel + caudal) se deriva al leer.
 */
@Entity
@Table(name = "lectura")
@Getter
@Setter
@NoArgsConstructor
public class Lectura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stationId;

    /** Formato "yyyy-MM-dd'T'HH:mm" (hora local Perú). */
    private String fecha;

    @Enumerated(EnumType.STRING)
    private Variable variable;

    private Double valor;
}
