package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.ConfigRecord;
import pe.gob.senamhi.hidrologia.domain.model.Variable;
import pe.gob.senamhi.hidrologia.domain.service.ConfigRecordService;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.util.List;

@RestController
@RequestMapping("/api/config-records")
public class ConfigRecordController {

    private final ConfigRecordService configRecordService;

    public ConfigRecordController(ConfigRecordService configRecordService) {
        this.configRecordService = configRecordService;
    }

    @GetMapping
    public ResponseModel<List<ConfigRecord>> list(
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String variable) {
        Variable v = variable != null ? Variable.from(variable) : null;
        return ResponseModel.ok(configRecordService.registros(stationId, v));
    }

    @GetMapping("/vigente")
    public ResponseModel<ConfigRecord> vigente(
            @RequestParam String stationId,
            @RequestParam String variable,
            @RequestParam String fecha) {
        return ResponseModel.ok(configRecordService.vigente(stationId, Variable.from(variable), fecha));
    }

    @PostMapping
    public ResponseModel<ConfigRecord> create(@RequestBody ConfigRecord body) {
        return ResponseModel.ok(configRecordService.create(body));
    }

    @PutMapping("/{id}")
    public ResponseModel<ConfigRecord> update(@PathVariable Long id, @RequestBody ConfigRecord body) {
        return ResponseModel.ok(configRecordService.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseModel<Void> delete(@PathVariable Long id) {
        configRecordService.delete(id);
        return ResponseModel.ok(null);
    }
}
