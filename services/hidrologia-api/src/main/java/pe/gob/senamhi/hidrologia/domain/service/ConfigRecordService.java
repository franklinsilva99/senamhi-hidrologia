package pe.gob.senamhi.hidrologia.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.senamhi.hidrologia.domain.model.ConfigRecord;
import pe.gob.senamhi.hidrologia.domain.model.Variable;
import pe.gob.senamhi.hidrologia.domain.repository.ConfigRecordRepository;

import java.util.Comparator;
import java.util.List;

/**
 * Tabla de configuración: umbrales + vigencia por (estación, variable, periodo).
 * El "registro vigente" se resuelve filtrando en memoria, como en el PoC
 * ({@code getConfigVigente}).
 */
@Service
public class ConfigRecordService {

    private final ConfigRecordRepository repository;

    public ConfigRecordService(ConfigRecordRepository repository) {
        this.repository = repository;
    }

    public List<ConfigRecord> registros(String stationId, Variable variable) {
        if (stationId != null && variable != null) {
            return repository.findByStationIdAndVariable(stationId, variable);
        }
        if (stationId != null) {
            return repository.findByStationId(stationId);
        }
        return repository.findAll();
    }

    /** Registro vigente para una (estación, variable) en la fecha dada. */
    public ConfigRecord vigente(String stationId, Variable variable, String fecha) {
        String d = fecha != null && fecha.length() >= 10 ? fecha.substring(0, 10) : fecha;
        return repository.findByStationIdAndVariable(stationId, variable).stream()
                .filter(r -> r.getPeriodo() != null
                        && r.getPeriodo().getInicio() != null
                        && r.getPeriodo().getInicio().compareTo(d) <= 0
                        && (r.getPeriodo().getFin() == null || d.compareTo(r.getPeriodo().getFin()) <= 0))
                .max(Comparator.comparing((ConfigRecord r) -> r.getPeriodo().getInicio()))
                .orElse(null);
    }

    @Transactional
    public ConfigRecord create(ConfigRecord record) {
        String hasta = record.getPeriodo() != null ? record.getPeriodo().getInicio() : null;
        cerrarAbierto(record.getStationId(), record.getVariable(), hasta);
        return repository.save(record);
    }

    @Transactional
    public ConfigRecord update(Long id, ConfigRecord record) {
        record.setId(id);
        return repository.save(record);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    /** Cierra (fija {@code fin}) el registro abierto de una (estación, variable). */
    private void cerrarAbierto(String stationId, Variable variable, String hasta) {
        repository.findByStationIdAndVariable(stationId, variable).stream()
                .filter(r -> r.getPeriodo() != null && r.getPeriodo().getFin() == null)
                .forEach(r -> {
                    r.getPeriodo().setFin(hasta);
                    repository.save(r);
                });
    }
}
