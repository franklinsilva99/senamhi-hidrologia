package pe.gob.senamhi.hidrologia.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.senamhi.hidrologia.domain.model.Alert;
import pe.gob.senamhi.hidrologia.domain.model.CentroPoblado;
import pe.gob.senamhi.hidrologia.domain.model.ConfigRecord;
import pe.gob.senamhi.hidrologia.domain.model.ForecastInput;
import pe.gob.senamhi.hidrologia.domain.model.Lectura;
import pe.gob.senamhi.hidrologia.domain.model.PobladoGeo;
import pe.gob.senamhi.hidrologia.domain.model.Station;
import pe.gob.senamhi.hidrologia.domain.model.Variable;
import pe.gob.senamhi.hidrologia.domain.repository.AlertRepository;
import pe.gob.senamhi.hidrologia.domain.repository.CentroPobladoRepository;
import pe.gob.senamhi.hidrologia.domain.repository.ConfigRecordRepository;
import pe.gob.senamhi.hidrologia.domain.repository.ForecastInputRepository;
import pe.gob.senamhi.hidrologia.domain.repository.LecturaRepository;
import pe.gob.senamhi.hidrologia.domain.repository.StationRepository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Siembra la BD con los JSON del PoC en el primer arranque (si no hay estaciones).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ObjectMapper objectMapper;
    private final StationRepository stationRepository;
    private final LecturaRepository lecturaRepository;
    private final ConfigRecordRepository configRecordRepository;
    private final AlertRepository alertRepository;
    private final ForecastInputRepository forecastInputRepository;
    private final CentroPobladoRepository centroPobladoRepository;

    public DataSeeder(
            ObjectMapper objectMapper,
            StationRepository stationRepository,
            LecturaRepository lecturaRepository,
            ConfigRecordRepository configRecordRepository,
            AlertRepository alertRepository,
            ForecastInputRepository forecastInputRepository,
            CentroPobladoRepository centroPobladoRepository) {
        this.objectMapper = objectMapper;
        this.stationRepository = stationRepository;
        this.lecturaRepository = lecturaRepository;
        this.configRecordRepository = configRecordRepository;
        this.alertRepository = alertRepository;
        this.forecastInputRepository = forecastInputRepository;
        this.centroPobladoRepository = centroPobladoRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (stationRepository.count() > 0) {
            return;
        }

        // 1) Cotas
        Map<String, SeedModels.Cota> cotas = new HashMap<>();
        for (SeedModels.Cota c : readList("data/cotas.json", SeedModels.Cota.class)) {
            cotas.put(c.stationId(), c);
        }

        // 2) Estaciones (+ cota)
        List<Station> stations = new ArrayList<>();
        for (SeedModels.Station sd : readList("data/stations.json", SeedModels.Station.class)) {
            Station s = new Station();
            s.setCodigo(sd.id());
            s.setN(sd.n());
            s.setCuenca(sd.cuenca());
            s.setEstacion(sd.estacion());
            s.setRio(sd.rio());
            s.setCodigoAuto(sd.codigoAuto());
            s.setCodigoConvencional(sd.codigoConvencional());
            s.setDz(sd.dz());
            s.setEscalaTemporal(sd.escalaTemporal());
            s.setRegion(sd.region());
            s.setLat(sd.lat());
            s.setLon(sd.lon());
            s.setIsEstimated(sd.isEstimated());
            s.setFuente(sd.fuente());
            s.setPoblados(sd.poblados());
            s.setPobladosGeo(sd.pobladosGeo());
            s.setPolygon(sd.polygon());
            s.setDepartamento(sd.departamento());
            s.setProvincia(sd.provincia());
            s.setDistritos(sd.distritos());
            s.setVariables(sd.variables());
            s.setPreferencia(sd.preferencia());
            s.setTipo(sd.tipo());
            s.setModoPublicacion(sd.modoPublicacion());
            s.setEstado(sd.estado());

            SeedModels.Cota cota = cotas.get(sd.id());
            if (cota != null) {
                s.setCota(cota.cota());
                s.setCotaFuente(cota.cotaFuente());
            }
            stations.add(s);
        }
        stationRepository.saveAll(stations);

        // 3) Configuración (umbrales + vigencia)
        configRecordRepository.saveAll(readList("data/config_records.json", ConfigRecord.class));

        // 4) Series: nivel + caudal → Lectura
        List<Lectura> lecturas = new ArrayList<>();
        for (Lectura l : readList("data/nivel.json", Lectura.class)) {
            l.setVariable(Variable.NIVEL);
            lecturas.add(l);
        }
        for (Lectura l : readList("data/caudal.json", Lectura.class)) {
            l.setVariable(Variable.CAUDAL);
            lecturas.add(l);
        }
        lecturaRepository.saveAll(lecturas);

        // 5) Avisos
        alertRepository.saveAll(readList("data/alerts.json", Alert.class));

        // 6) Pronóstico
        forecastInputRepository.saveAll(readList("data/forecast_inputs.json", ForecastInput.class));

        // 7) Centros poblados (desde pobladosGeo de las estaciones)
        List<CentroPoblado> cps = new ArrayList<>();
        for (Station s : stations) {
            if (s.getPobladosGeo() == null) {
                continue;
            }
            for (PobladoGeo g : s.getPobladosGeo()) {
                CentroPoblado cp = new CentroPoblado();
                cp.setNombre(g.getNombre());
                cp.setLat(g.getLat());
                cp.setLon(g.getLon());
                cp.setDistrito(s.getDistritos() != null && !s.getDistritos().isEmpty()
                        ? s.getDistritos().get(0) : null);
                cp.setProvincia(s.getProvincia() != null && !s.getProvincia().isEmpty()
                        ? s.getProvincia().get(0) : null);
                cp.setDepartamento(s.getDepartamento());
                cp.setStationId(s.getCodigo());
                cps.add(cp);
            }
        }
        centroPobladoRepository.saveAll(cps);
    }

    private <T> List<T> readList(String path, Class<T> clazz) throws IOException {
        Resource res = new ClassPathResource(path);
        return objectMapper.readValue(
                res.getInputStream(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
    }
}
