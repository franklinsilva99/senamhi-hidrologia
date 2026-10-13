package pe.gob.senamhi.hidrologia.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.gob.senamhi.hidrologia.domain.model.Lectura;

import java.util.List;

public interface LecturaRepository extends JpaRepository<Lectura, Long> {
    List<Lectura> findByStationIdOrderByFechaAsc(String stationId);
}
