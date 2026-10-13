package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.Station;
import pe.gob.senamhi.hidrologia.domain.repository.StationRepository;
import pe.gob.senamhi.hidrologia.web.NotFoundException;
import pe.gob.senamhi.hidrologia.web.PaginatedResponseModel;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final StationRepository stationRepository;

    public StationController(StationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    @GetMapping
    public PaginatedResponseModel<Station> list(@RequestParam(required = false) String codigo) {
        List<Station> all = codigo != null
                ? stationRepository.findByCodigo(codigo).map(List::of).orElse(List.of())
                : stationRepository.findAll();
        return PaginatedResponseModel.ok(all, all.size(), 1, 0, all.size());
    }

    @GetMapping("/{id}")
    public ResponseModel<Station> get(@PathVariable Long id) {
        return ResponseModel.ok(find(id));
    }

    @PutMapping("/{id}")
    public ResponseModel<Station> update(@PathVariable Long id, @RequestBody Station body) {
        Station s = find(id);
        applyPatch(s, body);
        return ResponseModel.ok(stationRepository.save(s));
    }

    private Station find(Long id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Estación no encontrada: " + id));
    }

    /** Actualiza solo los campos configurables de la ficha. */
    private void applyPatch(Station s, Station body) {
        if (body.getPreferencia() != null) {
            s.setPreferencia(body.getPreferencia());
        }
        if (body.getTipo() != null) {
            s.setTipo(body.getTipo());
        }
        if (body.getModoPublicacion() != null) {
            s.setModoPublicacion(body.getModoPublicacion());
        }
        if (body.getEstado() != null) {
            s.setEstado(body.getEstado());
        }
        if (body.getCota() != null) {
            s.setCota(body.getCota());
        }
        if (body.getCotaFuente() != null) {
            s.setCotaFuente(body.getCotaFuente());
        }
        if (body.getVariables() != null) {
            s.setVariables(body.getVariables());
        }
        if (body.getPoblados() != null) {
            s.setPoblados(body.getPoblados());
        }
        if (body.getPobladosGeo() != null) {
            s.setPobladosGeo(body.getPobladosGeo());
        }
    }
}
