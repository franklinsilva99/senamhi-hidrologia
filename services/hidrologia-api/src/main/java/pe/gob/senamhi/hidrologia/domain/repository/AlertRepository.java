package pe.gob.senamhi.hidrologia.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.gob.senamhi.hidrologia.domain.model.Alert;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findAllByOrderByNroDesc();

    Optional<Alert> findByCa(String ca);

    List<Alert> findByStationIdAndVigenteTrue(String stationId);
}
