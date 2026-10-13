package pe.gob.senamhi.hidrologia.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.gob.senamhi.hidrologia.domain.model.ConfigRecord;
import pe.gob.senamhi.hidrologia.domain.model.Variable;

import java.util.List;

public interface ConfigRecordRepository extends JpaRepository<ConfigRecord, Long> {
    List<ConfigRecord> findByStationId(String stationId);

    List<ConfigRecord> findByStationIdAndVariable(String stationId, Variable variable);
}
