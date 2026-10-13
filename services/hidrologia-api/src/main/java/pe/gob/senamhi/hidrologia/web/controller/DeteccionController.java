package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.DeteccionAviso;
import pe.gob.senamhi.hidrologia.domain.model.ObservationView;
import pe.gob.senamhi.hidrologia.domain.model.Station;
import pe.gob.senamhi.hidrologia.domain.repository.StationRepository;
import pe.gob.senamhi.hidrologia.domain.service.DeteccionService;
import pe.gob.senamhi.hidrologia.domain.service.ObservacionService;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/detection")
public class DeteccionController {

    private final StationRepository stationRepository;
    private final ObservacionService observacionService;
    private final DeteccionService deteccionService;

    public DeteccionController(
            StationRepository stationRepository,
            ObservacionService observacionService,
            DeteccionService deteccionService) {
        this.stationRepository = stationRepository;
        this.observacionService = observacionService;
        this.deteccionService = deteccionService;
    }

    @GetMapping
    public ResponseModel<List<DeteccionAviso>> detect() {
        List<Station> stations = stationRepository.findAll();
        Map<String, ObservationView> latest = observacionService.latest();
        String fecha = LocalDate.now().toString();
        return ResponseModel.ok(deteccionService.detectarAvisos(stations, latest, fecha));
    }
}
