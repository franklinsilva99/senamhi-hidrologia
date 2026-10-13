package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.ForecastDiario;
import pe.gob.senamhi.hidrologia.domain.model.ForecastInput;
import pe.gob.senamhi.hidrologia.domain.repository.ForecastInputRepository;
import pe.gob.senamhi.hidrologia.domain.service.PronosticoService;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.util.List;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {

    private final ForecastInputRepository forecastInputRepository;
    private final PronosticoService pronosticoService;

    public ForecastController(
            ForecastInputRepository forecastInputRepository,
            PronosticoService pronosticoService) {
        this.forecastInputRepository = forecastInputRepository;
        this.pronosticoService = pronosticoService;
    }

    @GetMapping("/inputs")
    public ResponseModel<List<ForecastInput>> inputs(
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String fecha) {
        List<ForecastInput> all = stationId != null
                ? forecastInputRepository.findByStationIdOrderByFechaAsc(stationId)
                : forecastInputRepository.findAllByOrderByStationIdAscFechaAsc();
        if (fecha != null) {
            all = all.stream().filter(f -> fecha.equals(f.getFecha())).toList();
        }
        return ResponseModel.ok(all);
    }

    @PostMapping("/inputs")
    public ResponseModel<ForecastInput> create(@RequestBody ForecastInput body) {
        return ResponseModel.ok(forecastInputRepository.save(body));
    }

    @DeleteMapping("/inputs/{id}")
    public ResponseModel<Void> delete(@PathVariable Long id) {
        forecastInputRepository.deleteById(id);
        return ResponseModel.ok(null);
    }

    @GetMapping("/diario")
    public ResponseModel<List<ForecastDiario>> diario(@RequestParam(required = false) String stationId) {
        List<ForecastInput> inputs = stationId != null
                ? forecastInputRepository.findByStationIdOrderByFechaAsc(stationId)
                : forecastInputRepository.findAllByOrderByStationIdAscFechaAsc();
        return ResponseModel.ok(pronosticoService.buildForecastDiario(inputs));
    }
}
