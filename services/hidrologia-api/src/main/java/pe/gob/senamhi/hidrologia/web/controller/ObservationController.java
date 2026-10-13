package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.Lectura;
import pe.gob.senamhi.hidrologia.domain.model.ObservationView;
import pe.gob.senamhi.hidrologia.domain.repository.LecturaRepository;
import pe.gob.senamhi.hidrologia.domain.repository.StationRepository;
import pe.gob.senamhi.hidrologia.domain.service.ObservacionService;
import pe.gob.senamhi.hidrologia.web.NotFoundException;
import pe.gob.senamhi.hidrologia.web.Requests;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ObservationController {

    private final ObservacionService observacionService;
    private final StationRepository stationRepository;
    private final LecturaRepository lecturaRepository;

    public ObservationController(
            ObservacionService observacionService,
            StationRepository stationRepository,
            LecturaRepository lecturaRepository) {
        this.observacionService = observacionService;
        this.stationRepository = stationRepository;
        this.lecturaRepository = lecturaRepository;
    }

    @GetMapping("/stations/{id}/observations")
    public ResponseModel<List<ObservationView>> observations(
            @PathVariable Long id,
            @RequestParam(required = false) Integer hours) {
        return ResponseModel.ok(observacionService.serieFusionada(codigoDe(id), hours));
    }

    @GetMapping("/stations/{id}/observations/latest")
    public ResponseModel<ObservationView> latest(@PathVariable Long id) {
        return ResponseModel.ok(observacionService.latest(codigoDe(id)));
    }

    @GetMapping("/observations/latest")
    public ResponseModel<Map<String, ObservationView>> latestAll() {
        return ResponseModel.ok(observacionService.latest());
    }

    @GetMapping("/stations/{id}/caudal/diario")
    public ResponseModel<Map<String, Double>> caudalDiario(@PathVariable Long id) {
        return ResponseModel.ok(observacionService.caudalPromedioDiario(codigoDe(id)));
    }

    @PostMapping("/stations/{id}/observations")
    public ResponseModel<Lectura> ingest(@PathVariable Long id, @RequestBody Requests.Lectura body) {
        Lectura l = new Lectura();
        l.setStationId(codigoDe(id));
        l.setFecha(body.fecha());
        l.setVariable(body.variable());
        l.setValor(body.valor());
        return ResponseModel.ok(lecturaRepository.save(l));
    }

    private String codigoDe(Long id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Estación no encontrada: " + id))
                .getCodigo();
    }
}
