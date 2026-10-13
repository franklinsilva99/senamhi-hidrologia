package pe.gob.senamhi.hidrologia.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.gob.senamhi.hidrologia.domain.model.ForecastInput;

import java.util.List;

public interface ForecastInputRepository extends JpaRepository<ForecastInput, Long> {
    List<ForecastInput> findAllByOrderByStationIdAscFechaAsc();

    List<ForecastInput> findByStationIdOrderByFechaAsc(String stationId);
}
