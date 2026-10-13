package pe.gob.senamhi.hidrologia.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.senamhi.hidrologia.domain.model.Alert;
import pe.gob.senamhi.hidrologia.domain.model.ConfigRecord;
import pe.gob.senamhi.hidrologia.domain.model.DeteccionAviso;
import pe.gob.senamhi.hidrologia.domain.model.ModoPublicacion;
import pe.gob.senamhi.hidrologia.domain.model.NivelAlerta;
import pe.gob.senamhi.hidrologia.domain.model.ObservationView;
import pe.gob.senamhi.hidrologia.domain.model.Station;
import pe.gob.senamhi.hidrologia.domain.model.TiempoVigenciaHrs;
import pe.gob.senamhi.hidrologia.domain.model.TipoAviso;
import pe.gob.senamhi.hidrologia.domain.model.Umbrales;
import pe.gob.senamhi.hidrologia.domain.model.Variable;
import pe.gob.senamhi.hidrologia.domain.repository.AlertRepository;
import pe.gob.senamhi.hidrologia.domain.repository.StationRepository;
import pe.gob.senamhi.hidrologia.web.NotFoundException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Orquestador de avisos: crear / reemplazar / mantener (port de {@code lib/domain/avisos.ts}).
 */
@Service
public class AvisoService {

    private static final String[] DIAS = {
            "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
    };
    private static final String[] MESES = {
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    };

    private final AlertRepository alertRepository;
    private final StationRepository stationRepository;
    private final ObservacionService observacionService;
    private final DeteccionService deteccionService;
    private final ConfigRecordService configRecordService;
    private final UmbralService umbralService;

    public AvisoService(
            AlertRepository alertRepository,
            StationRepository stationRepository,
            ObservacionService observacionService,
            DeteccionService deteccionService,
            ConfigRecordService configRecordService,
            UmbralService umbralService) {
        this.alertRepository = alertRepository;
        this.stationRepository = stationRepository;
        this.observacionService = observacionService;
        this.deteccionService = deteccionService;
        this.configRecordService = configRecordService;
        this.umbralService = umbralService;
    }

    // ── Consultas ────────────────────────────────────────────────────────────

    public List<Alert> listar() {
        return alertRepository.findAllByOrderByNroDesc();
    }

    public Alert porCa(String ca) {
        return alertRepository.findByCa(ca)
                .orElseThrow(() -> new NotFoundException("Aviso no encontrado: " + ca));
    }

    // ── Detección / procesamiento ────────────────────────────────────────────

    /** Ejecuta la detección sobre todas las estaciones y aplica crear/reemplazar/mantener. */
    @Transactional
    public List<String> runDetection() {
        List<Station> stations = stationRepository.findAll();
        Map<String, ObservationView> latest = observacionService.latest();
        LocalDateTime now = LocalDateTime.now();
        String fecha = now.toLocalDate().toString();
        List<DeteccionAviso> det = deteccionService.detectarAvisos(stations, latest, fecha);

        List<Alert> next = new ArrayList<>(alertRepository.findAll());
        List<String> textos = new ArrayList<>();

        for (DeteccionAviso d : det) {
            if (!Boolean.TRUE.equals(d.getExcedido()) || d.getUmbral() == null) {
                continue;
            }
            if ("mantener".equals(evaluarAccionAviso(d.getStationId(), d.getUmbral().name(), next))) {
                continue;
            }
            Station station = stations.stream()
                    .filter(s -> s.getCodigo().equals(d.getStationId()))
                    .findFirst()
                    .orElse(null);
            if (station == null || station.getModoPublicacion() == ModoPublicacion.MANUAL) {
                continue;
            }
            ConfigRecord record = configRecordService.vigente(d.getStationId(), d.getPreferencia(), fecha);
            if (record == null) {
                continue;
            }
            Alert aviso = crearAviso(station, latest, record, d.getPreferencia(), now,
                    observacionService.serieFusionada(d.getStationId(), null),
                    siguienteNro(next), siguienteCA(next));
            Aplicacion res = aplicarAviso(next, aviso);
            next = res.next();
            textos.add(res.texto());
        }

        alertRepository.saveAll(next);
        return textos;
    }

    /** Publicación manual de una estación (ignora el modo de publicación). */
    @Transactional
    public String publicarManual(String stationId) {
        Station station = stationRepository.findByCodigo(stationId)
                .orElseThrow(() -> new NotFoundException("Estación no encontrada: " + stationId));
        Map<String, ObservationView> latest = observacionService.latest();
        LocalDateTime now = LocalDateTime.now();
        String fecha = now.toLocalDate().toString();

        DeteccionAviso d = deteccionService.detectar(station, latest, fecha);
        if (!Boolean.TRUE.equals(d.getExcedido()) || d.getUmbral() == null) {
            return "Sin umbral excedido para la estación " + stationId + ".";
        }
        ConfigRecord record = configRecordService.vigente(stationId, d.getPreferencia(), fecha);
        if (record == null) {
            return "Sin configuración vigente para " + stationId + ".";
        }

        List<Alert> base = new ArrayList<>(alertRepository.findAll());
        Alert aviso = crearAviso(station, latest, record, d.getPreferencia(), now,
                observacionService.serieFusionada(stationId, null),
                siguienteNro(base), siguienteCA(base));
        Aplicacion res = aplicarAviso(base, aviso);
        alertRepository.saveAll(res.next());
        return res.texto();
    }

    /** Habilitar/deshabilitar y/o validar DZ de un aviso. */
    @Transactional
    public Alert patch(String ca, Boolean vigente, Boolean validadoDZ) {
        Alert alert = porCa(ca);
        if (vigente != null) {
            alert.setVigente(vigente);
        }
        if (validadoDZ != null) {
            alert.setValidadoDZ(validadoDZ);
        }
        return alertRepository.save(alert);
    }

    // ── Compuertas (pool 1) ──────────────────────────────────────────────────

    private Alert existeAvisoPrevio(String stationId, List<Alert> alerts) {
        return alerts.stream()
                .filter(a -> a.getStationId().equals(stationId) && Boolean.TRUE.equals(a.getVigente()))
                .findFirst()
                .orElse(null);
    }

    private int siguienteNro(List<Alert> alerts) {
        return alerts.stream().mapToInt(a -> a.getNro() == null ? 0 : a.getNro()).max().orElse(0) + 1;
    }

    private String siguienteCA(List<Alert> alerts) {
        int max = alerts.stream()
                .mapToInt(a -> {
                    try {
                        return Integer.parseInt(a.getCa());
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .max()
                .orElse(0);
        return String.valueOf(max + 1);
    }

    private String evaluarAccionAviso(String stationId, String nuevoNivel, List<Alert> alerts) {
        Alert previo = existeAvisoPrevio(stationId, alerts);
        if (previo == null) {
            return "crear";
        }
        return previo.getNivel().name().equals(nuevoNivel) ? "mantener" : "reemplazar";
    }

    // ── Preparación (pool 2) ─────────────────────────────────────────────────

    private record PreparacionAviso(
            String titulo,
            String cuerpoAgua,
            String distrito,
            NivelAlerta nivel,
            String descripcion,
            String recomendaciones,
            String fechaEmision,
            String fin,
            Integer duracionHoras,
            String plazo,
            List<String> poblados,
            TipoAviso tipo) {
    }

    private record Aplicacion(List<Alert> next, String texto) {
    }

    private PreparacionAviso prepararAviso(
            Station station,
            Map<String, ObservationView> latest,
            ConfigRecord record,
            Variable preferencia,
            LocalDateTime now) {

        ObservationView latestObs = latest.get(station.getCodigo());
        TipoAviso tipo = station.getTipo() != null ? station.getTipo() : TipoAviso.AVENIDA;
        boolean esNivel = preferencia == Variable.NIVEL;

        double valorActual = esNivel
                ? (latestObs != null && latestObs.getNivel() != null ? latestObs.getNivel() : 0)
                : (latestObs != null && latestObs.getCaudal() != null ? latestObs.getCaudal() : 0);

        Umbrales u = tipo == TipoAviso.AVENIDA
                ? record.getUmbrales().getAvenida()
                : record.getUmbrales().getVigilancia();
        NivelAlerta nivel = umbralService.clasificarNivel(valorActual, u, tipo);
        if (nivel == null) {
            return null;
        }

        double valorMostrado = esNivel && station.getCota() != null
                ? valorActual + station.getCota()
                : valorActual;
        String variable = esNivel ? "NIVEL" : "CAUDAL";
        String unidad = esNivel ? "m.s.n.m." : "m³/s";

        String titulo = "SITUACIÓN ACTUAL DEL " + variable + " DEL RÍO "
                + station.getRio().toUpperCase() + " - ESTACIÓN " + station.getEstacion().toUpperCase();
        String cuerpoAgua = "RÍO " + station.getRio().toUpperCase();
        String distrito = station.getDistritos() == null || station.getDistritos().isEmpty()
                ? "—"
                : String.join(", ", station.getDistritos());

        Integer duracionHoras = duracionDe(nivel, record.getTiempoVigenciaHrs());
        String plazo = duracionHoras > 120 ? "extendido" : "normal";
        String fin = now.plusHours(duracionHoras).toLocalDate().toString();
        String fechaEmision = fechaEmision(now);

        String tendencia = tipo == TipoAviso.VIGILANCIA
                ? "con tendencia descendente"
                : "con tendencia ascendente";
        String pobladosUpper = station.getPoblados() == null
                ? ""
                : station.getPoblados().stream().map(String::toUpperCase).collect(Collectors.joining(", "));

        String descripcion = "El SENAMHI, organismo adscrito al Ministerio del Ambiente, informa sobre el "
                + "comportamiento hidrológico del " + cuerpoAgua + ". La estación hidrológica "
                + station.getEstacion().toUpperCase() + ", registró un " + variable + " de "
                + String.format(Locale.ROOT, "%.2f", valorMostrado) + " " + unidad + ", " + tendencia
                + ", ubicándose en el umbral " + nivel + ". Las potenciales áreas de afectación serían los "
                + "centros poblados de " + pobladosUpper + ". Se recomienda a la población tomar las precauciones "
                + "correspondientes y evitar realizar cualquier actividad cercana al río. El SENAMHI continuará "
                + "vigilante al comportamiento del río y sugiere a la ciudadanía mantenerse informada a través de "
                + "la web institucional y redes sociales.";

        String recomendaciones = recomendacion(tipo, nivel);

        return new PreparacionAviso(
                titulo, cuerpoAgua, distrito, nivel, descripcion, recomendaciones,
                fechaEmision, fin, duracionHoras, plazo,
                station.getPoblados() == null ? List.of() : station.getPoblados(),
                tipo);
    }

    private Alert crearAviso(
            Station station,
            Map<String, ObservationView> latest,
            ConfigRecord record,
            Variable preferencia,
            LocalDateTime now,
            List<ObservationView> serie,
            int nro,
            String ca) {

        PreparacionAviso p = prepararAviso(station, latest, record, preferencia, now);
        if (p == null) {
            throw new IllegalStateException("No hay umbral excedido para la estación " + station.getCodigo());
        }
        ObservationView latestObs = latest.get(station.getCodigo());
        boolean esNivel = preferencia == Variable.NIVEL;
        Double cota = station.getCota();

        Alert a = new Alert();
        a.setNro(nro);
        a.setCa(ca);
        a.setCe(station.getCodigoAuto() != null ? station.getCodigoAuto() : "00000000");
        a.setStationId(station.getCodigo());
        a.setTitulo(p.titulo());
        a.setCuerpoAgua(p.cuerpoAgua());
        a.setDistrito(p.distrito());
        a.setInicio(now.toLocalDate().toString());
        a.setFin(p.fin());
        a.setDuracionHoras(p.duracionHoras());
        a.setNivel(p.nivel());
        a.setPlazo(p.plazo());
        a.setVigente(true);
        a.setFechaEmision(p.fechaEmision());
        a.setDescripcion(p.descripcion());
        a.setRecomendaciones(p.recomendaciones());
        a.setValidadoDZ(false);
        a.setPoblados(new ArrayList<>(p.poblados()));
        a.setCaudalActual(esNivel ? null : (latestObs != null ? latestObs.getCaudal() : null));
        a.setNivelActual(esNivel && cota != null
                ? (latestObs != null && latestObs.getNivel() != null ? latestObs.getNivel() : 0) + cota
                : null);
        a.setPreferencia(preferencia);
        a.setTipo(p.tipo());
        a.setCota(cota);
        a.setUmbrales(p.tipo() == TipoAviso.AVENIDA
                ? record.getUmbrales().getAvenida()
                : record.getUmbrales().getVigilancia());
        a.setSerie(serie);
        return a;
    }

    private Aplicacion aplicarAviso(List<Alert> base, Alert aviso) {
        String accion = evaluarAccionAviso(aviso.getStationId(), aviso.getNivel().name(), base);
        if ("mantener".equals(accion)) {
            return new Aplicacion(new ArrayList<>(base),
                    "Sin cambios: la estación ya tiene un aviso vigente en nivel " + aviso.getNivel() + ".");
        }
        if ("reemplazar".equals(accion)) {
            Alert previo = existeAvisoPrevio(aviso.getStationId(), base);
            List<Alert> next = new ArrayList<>();
            for (Alert a : base) {
                if (a.getStationId().equals(aviso.getStationId()) && Boolean.TRUE.equals(a.getVigente())) {
                    a.setVigente(false);
                }
                next.add(a);
            }
            next.add(aviso);
            return new Aplicacion(next,
                    "Aviso #" + (previo != null ? previo.getNro() : "?") + " desactivado. Nuevo aviso #"
                            + aviso.getNro() + " publicado (" + aviso.getNivel() + ").");
        }
        List<Alert> next = new ArrayList<>(base);
        next.add(aviso);
        return new Aplicacion(next, "Aviso #" + aviso.getNro() + " publicado correctamente (" + aviso.getNivel() + ").");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Integer duracionDe(NivelAlerta nivel, TiempoVigenciaHrs t) {
        if (t == null) {
            return 200;
        }
        return switch (nivel) {
            case AMARILLO -> t.getAmarilla() == null ? 200 : t.getAmarilla();
            case NARANJA -> t.getNaranja() == null ? 200 : t.getNaranja();
            case ROJO -> t.getRoja() == null ? 200 : t.getRoja();
        };
    }

    private String fechaEmision(LocalDateTime now) {
        int diaIdx = now.getDayOfWeek().getValue() % 7; // Sunday=0 ... Saturday=6
        return DIAS[diaIdx] + ", " + now.getDayOfMonth() + " de " + MESES[now.getMonthValue() - 1]
                + " de " + now.getYear() + " - "
                + String.format(Locale.ROOT, "%02d", now.getHour()) + ":"
                + String.format(Locale.ROOT, "%02d", now.getMinute()) + " hrs";
    }

    private String recomendacion(TipoAviso tipo, NivelAlerta nivel) {
        if (tipo == TipoAviso.VIGILANCIA) {
            return switch (nivel) {
                case AMARILLO -> "Vigilar el descenso del nivel del río. Mantenerse informado por la web institucional del SENAMHI.";
                case NARANJA -> "Precaución por la tendencia descendente del nivel. Mantenerse informado por la web institucional del SENAMHI.";
                case ROJO -> "Restringir la navegación y actividades fluviales por el descenso del nivel. Seguir indicaciones de la DZ y COEN.";
            };
        }
        return switch (nivel) {
            case AMARILLO -> "Seguir reportes de la DZ. Mantenerse informado por la web institucional del SENAMHI.";
            case NARANJA -> "Evitar cruce de cauce, alejar bienes de riberas. Mantenerse informado por la web institucional del SENAMHI.";
            case ROJO -> "Evitar cruzar el cauce, alejar bienes de riberas. Seguir indicaciones de la DZ y COEN.";
        };
    }
}
