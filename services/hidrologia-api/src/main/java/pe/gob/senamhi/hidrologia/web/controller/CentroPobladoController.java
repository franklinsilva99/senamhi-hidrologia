package pe.gob.senamhi.hidrologia.web.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.senamhi.hidrologia.domain.model.CentroPoblado;
import pe.gob.senamhi.hidrologia.domain.repository.CentroPobladoRepository;
import pe.gob.senamhi.hidrologia.web.ResponseModel;

import java.util.List;

@RestController
@RequestMapping("/api/centros-poblados")
public class CentroPobladoController {

    private final CentroPobladoRepository centroPobladoRepository;

    public CentroPobladoController(CentroPobladoRepository centroPobladoRepository) {
        this.centroPobladoRepository = centroPobladoRepository;
    }

    @GetMapping
    public ResponseModel<List<CentroPoblado>> list() {
        return ResponseModel.ok(centroPobladoRepository.findAll());
    }

    @PostMapping
    public ResponseModel<CentroPoblado> create(@RequestBody CentroPoblado body) {
        return ResponseModel.ok(centroPobladoRepository.save(body));
    }

    @PutMapping("/{id}")
    public ResponseModel<CentroPoblado> update(@PathVariable Long id, @RequestBody CentroPoblado body) {
        body.setId(id);
        return ResponseModel.ok(centroPobladoRepository.save(body));
    }

    @DeleteMapping("/{id}")
    public ResponseModel<Void> delete(@PathVariable Long id) {
        centroPobladoRepository.deleteById(id);
        return ResponseModel.ok(null);
    }
}
