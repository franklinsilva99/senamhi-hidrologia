package pe.gob.senamhi.hidrologia.web;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Envoltorio de respuesta estándar:
 * {@code { "status": true, "message": null, "trace": null, "data": <T> }}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponseModel<T> {

    private boolean status;
    private String message;
    private String trace;
    private T data;

    public static <T> ResponseModel<T> ok(T data) {
        return new ResponseModel<>(true, null, null, data);
    }

    public static <T> ResponseModel<T> error(String message) {
        return new ResponseModel<>(false, message, null, null);
    }
}
