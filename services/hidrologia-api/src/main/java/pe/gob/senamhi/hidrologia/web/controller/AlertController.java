package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.Alert;
import pe.gob.senamhi.hidrologia.domain.service.AvisoService;
import pe.gob.senamhi.hidrologia.web.PaginatedResponseModel;
import pe.gob.senamhi.hidrologia.web.Requests;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AvisoService avisoService;

    public AlertController(AvisoService avisoService) {
        this.avisoService = avisoService;
    }

    @GetMapping
    public PaginatedResponseModel<Alert> list() {
        List<Alert> all = avisoService.listar();
        return PaginatedResponseModel.ok(all, all.size(), 1, 0, all.size());
    }

    @GetMapping("/{ca}")
    public ResponseModel<Alert> get(@PathVariable String ca) {
        return ResponseModel.ok(avisoService.porCa(ca));
    }

    @PostMapping("/run-detection")
    public ResponseModel<List<String>> runDetection() {
        return ResponseModel.ok(avisoService.runDetection());
    }

    @PostMapping
    public ResponseModel<String> publish(@RequestBody Requests.Publish body) {
        return ResponseModel.ok(avisoService.publicarManual(body.stationId()));
    }

    @PutMapping("/{ca}")
    public ResponseModel<Alert> patch(@PathVariable String ca, @RequestBody Requests.AlertPatch body) {
        return ResponseModel.ok(avisoService.patch(ca, body.vigente(), body.validadoDZ()));
    }
}
