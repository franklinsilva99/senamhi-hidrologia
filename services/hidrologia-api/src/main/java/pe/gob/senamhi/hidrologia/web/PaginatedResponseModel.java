package pe.gob.senamhi.hidrologia.web;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Envoltorio de respuesta paginada: extiende {@link ResponseModel} con la
 * metadata de paginación ({@code totalElements}, {@code totalPages}, {@code page}, {@code pageSize}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponseModel<T> {

    private boolean status;
    private String message;
    private String trace;
    private List<T> data;
    private long totalElements;
    private int totalPages;
    private int page;
    private int pageSize;

    public static <T> PaginatedResponseModel<T> ok(
            List<T> data, long totalElements, int totalPages, int page, int pageSize) {
        return new PaginatedResponseModel<>(true, null, null, data, totalElements, totalPages, page, pageSize);
    }
}
