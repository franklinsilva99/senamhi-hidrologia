package pe.gob.senamhi.hidrologia.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.gob.senamhi.hidrologia.domain.model.CentroPoblado;

public interface CentroPobladoRepository extends JpaRepository<CentroPoblado, Long> {
}
