package pe.gob.senamhi.hidrologia.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.gob.senamhi.hidrologia.domain.model.Station;

import java.util.Optional;

public interface StationRepository extends JpaRepository<Station, Long> {
    Optional<Station> findByCodigo(String codigo);
}
