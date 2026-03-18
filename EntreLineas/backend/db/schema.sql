-- ============================================================================
-- SCHEMA SQL - SISTEMA DE LIBRERÍA DIGITAL CON TIENDAS FÍSICAS
-- Base de datos: PostgreSQL
-- Descripción: Schema completo para plataforma de librería online
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE ROLES
-- ============================================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (nombre, descripcion) VALUES
    ('Visitante', 'Usuario no autenticado con acceso limitado'),
    ('Cliente', 'Cliente registrado que puede comprar y reservar'),
    ('Administrador', 'Administrador del sistema con permisos elevados'),
    ('Root', 'Usuario Root con acceso total al sistema');


-- ============================================================================
-- 2. TABLA DE USUARIOS
-- ============================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    codigo_postal VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);


-- ============================================================================
-- 3. TABLA INTERMEDIA: USUARIO_ROLES
-- ============================================================================
CREATE TABLE usuario_roles (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    rol_id INTEGER NOT NULL,
    asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, rol_id)
);

CREATE INDEX idx_usuario_roles_usuario_id ON usuario_roles(usuario_id);
CREATE INDEX idx_usuario_roles_rol_id ON usuario_roles(rol_id);


-- ============================================================================
-- 4. TABLA DE CATEGORÍAS
-- ============================================================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categorias (nombre, descripcion) VALUES
    ('Ficción', 'Libros de ficción y novelas'),
    ('No Ficción', 'Libros informativos y educativos'),
    ('Ciencia Ficción', 'Novelas de ciencia ficción'),
    ('Fantasía', 'Libros de fantasía'),
    ('Misterio', 'Novelas de misterio y suspense'),
    ('Autoayuda', 'Libros de desarrollo personal'),
    ('Técnico', 'Libros técnicos y programación'),
    ('Infantil', 'Libros para niños');


-- ============================================================================
-- 5. TABLA DE LIBROS
-- ============================================================================
CREATE TABLE libros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    editorial VARCHAR(150),
    categoria_id INTEGER,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    descripcion TEXT,
    stock_general INTEGER NOT NULL DEFAULT 0 CHECK (stock_general >= 0),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'agotado', 'descontinuado')),
    fecha_publicacion DATE,
    numero_paginas INTEGER,
    idioma VARCHAR(50) DEFAULT 'Español',
    portada_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE INDEX idx_libros_titulo ON libros(titulo);
CREATE INDEX idx_libros_autor ON libros(autor);
CREATE INDEX idx_libros_isbn ON libros(isbn);
CREATE INDEX idx_libros_categoria_id ON libros(categoria_id);
CREATE INDEX idx_libros_estado ON libros(estado);


-- ============================================================================
-- 6. TABLA DE TIENDAS FÍSICAS
-- ============================================================================
CREATE TABLE tiendas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(255),
    horario_atencion VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'en_construccion')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tiendas_ciudad ON tiendas(ciudad);
CREATE INDEX idx_tiendas_estado ON tiendas(estado);


-- ============================================================================
-- 7. TABLA DE INVENTARIO POR TIENDA
-- ============================================================================
CREATE TABLE inventario_tienda (
    id SERIAL PRIMARY KEY,
    tienda_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    cantidad_disponible INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    cantidad_minima INTEGER DEFAULT 5,
    cantidad_maxima INTEGER DEFAULT 100,
    ultimo_reabastecimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    UNIQUE(tienda_id, libro_id)
);

CREATE INDEX idx_inventario_tienda_tienda_id ON inventario_tienda(tienda_id);
CREATE INDEX idx_inventario_tienda_libro_id ON inventario_tienda(libro_id);


-- ============================================================================
-- 8. TABLA DE COMPRAS
-- ============================================================================
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    estado_compra VARCHAR(50) DEFAULT 'pendiente' CHECK (estado_compra IN ('pendiente', 'confirmada', 'enviada', 'entregada', 'cancelada')),
    metodo_pago VARCHAR(50),
    numero_seguimiento VARCHAR(100),
    fecha_entrega_estimada DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE INDEX idx_compras_usuario_id ON compras(usuario_id);
CREATE INDEX idx_compras_estado_compra ON compras(estado_compra);
CREATE INDEX idx_compras_fecha ON compras(fecha);


-- ============================================================================
-- 9. TABLA DE ITEMS DE COMPRA
-- ============================================================================
CREATE TABLE compra_items (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT
);

CREATE INDEX idx_compra_items_compra_id ON compra_items(compra_id);
CREATE INDEX idx_compra_items_libro_id ON compra_items(libro_id);


-- ============================================================================
-- 10. TABLA DE RESERVAS
-- ============================================================================
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    fecha_reserva DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_reserva VARCHAR(50) DEFAULT 'activa' CHECK (estado_reserva IN ('activa', 'completada', 'cancelada', 'vencida')),
    fecha_vencimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_reservas_usuario_id ON reservas(usuario_id);
CREATE INDEX idx_reservas_estado_reserva ON reservas(estado_reserva);


-- ============================================================================
-- 11. TABLA DE ITEMS DE RESERVA
-- ============================================================================
CREATE TABLE reserva_items (
    id SERIAL PRIMARY KEY,
    reserva_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    tienda_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE SET NULL
);

CREATE INDEX idx_reserva_items_reserva_id ON reserva_items(reserva_id);
CREATE INDEX idx_reserva_items_libro_id ON reserva_items(libro_id);


-- ============================================================================
-- 12. TABLA DE CARRITO DE COMPRAS
-- ============================================================================
CREATE TABLE carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_carrito_usuario_id ON carrito(usuario_id);


-- ============================================================================
-- 13. TABLA DE ITEMS DEL CARRITO
-- ============================================================================
CREATE TABLE carrito_items (
    id SERIAL PRIMARY KEY,
    carrito_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrito_id) REFERENCES carrito(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    UNIQUE(carrito_id, libro_id)
);

CREATE INDEX idx_carrito_items_carrito_id ON carrito_items(carrito_id);
CREATE INDEX idx_carrito_items_libro_id ON carrito_items(libro_id);


-- ============================================================================
-- 14. TABLA DE NOTICIAS
-- ============================================================================
CREATE TABLE noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    libro_relacionado_id INTEGER,
    creado_por INTEGER,
    fecha_publicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'publicada' CHECK (estado IN ('borrador', 'publicada', 'archivada')),
    imagen_url VARCHAR(500),
    resumen VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (libro_relacionado_id) REFERENCES libros(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_noticias_creado_por ON noticias(creado_por);
CREATE INDEX idx_noticias_libro_relacionado_id ON noticias(libro_relacionado_id);
CREATE INDEX idx_noticias_fecha_publicacion ON noticias(fecha_publicacion);
CREATE INDEX idx_noticias_estado ON noticias(estado);


-- ============================================================================
-- 15. TABLA DE SUSCRIPCIONES A NOTICIAS
-- ============================================================================
CREATE TABLE suscripciones_noticias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'cancelada')),
    frecuencia VARCHAR(50) DEFAULT 'diaria' CHECK (frecuencia IN ('diaria', 'semanal', 'mensual')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(usuario_id)
);

CREATE INDEX idx_suscripciones_noticias_usuario_id ON suscripciones_noticias(usuario_id);


-- ============================================================================
-- 16. TABLA DE TARJETAS DE CRÉDITO
-- ============================================================================
CREATE TABLE tarjetas_credito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    numero_enmascarado VARCHAR(20) NOT NULL,
    ultimos_digitos VARCHAR(4),
    titular VARCHAR(150) NOT NULL,
    fecha_expiracion VARCHAR(7),
    tipo_tarjeta VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'expirada')),
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_tarjetas_credito_usuario_id ON tarjetas_credito(usuario_id);


-- ============================================================================
-- 17. TABLA DE PAGOS
-- ============================================================================
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER NOT NULL,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_pago VARCHAR(50) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'procesado', 'aprobado', 'rechazado', 'reembolsado')),
    referencia_pago VARCHAR(100),
    metodo_pago VARCHAR(50),
    tarjeta_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (tarjeta_id) REFERENCES tarjetas_credito(id) ON DELETE SET NULL
);

CREATE INDEX idx_pagos_compra_id ON pagos(compra_id);
CREATE INDEX idx_pagos_estado_pago ON pagos(estado_pago);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);


-- ============================================================================
-- 18. TABLA DE RECOMENDACIONES
-- ============================================================================
CREATE TABLE recomendaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    fecha_recomendacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    origen VARCHAR(50) DEFAULT 'sistema' CHECK (origen IN ('sistema', 'bot', 'manual', 'algoritmo')),
    score DECIMAL(3, 2) DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
    viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, libro_id)
);

CREATE INDEX idx_recomendaciones_usuario_id ON recomendaciones(usuario_id);
CREATE INDEX idx_recomendaciones_libro_id ON recomendaciones(libro_id);
CREATE INDEX idx_recomendaciones_origen ON recomendaciones(origen);


-- ============================================================================
-- 19. TABLA DE AUDITORÍA (Opcional pero recomendado)
-- ============================================================================
CREATE TABLE auditoria_cambios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    tabla_afectada VARCHAR(100) NOT NULL,
    tipo_cambio VARCHAR(20) NOT NULL CHECK (tipo_cambio IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id INTEGER,
    datos_antiguos JSONB,
    datos_nuevos JSONB,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    direccion_ip VARCHAR(45)
);

CREATE INDEX idx_auditoria_cambios_usuario_id ON auditoria_cambios(usuario_id);
CREATE INDEX idx_auditoria_cambios_tabla_afectada ON auditoria_cambios(tabla_afectada);
CREATE INDEX idx_auditoria_cambios_fecha_cambio ON auditoria_cambios(fecha_cambio);


-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Información completa de compras con detalles
CREATE VIEW v_compras_detalladas AS
SELECT 
    c.id as compra_id,
    u.nombre as cliente,
    u.email,
    c.fecha,
    c.total,
    c.estado_compra,
    c.metodo_pago,
    COUNT(ci.id) as numero_libros
FROM compras c
JOIN usuarios u ON c.usuario_id = u.id
LEFT JOIN compra_items ci ON c.id = ci.compra_id
GROUP BY c.id, u.id;

-- Vista: Disponibilidad de libros por tienda
CREATE VIEW v_libros_disponibles_tienda AS
SELECT 
    l.id,
    l.titulo,
    l.autor,
    t.nombre as tienda,
    it.cantidad_disponible,
    l.precio
FROM libros l
JOIN inventario_tienda it ON l.id = it.libro_id
JOIN tiendas t ON it.tienda_id = t.id
WHERE it.cantidad_disponible > 0
ORDER BY t.nombre, l.titulo;

-- Vista: Stock general de libros por categoría
CREATE VIEW v_stock_categorias AS
SELECT 
    cat.nombre as categoria,
    COUNT(l.id) as total_libros,
    SUM(l.stock_general) as total_stock,
    AVG(l.precio) as precio_promedio
FROM categorias cat
LEFT JOIN libros l ON cat.id = l.categoria_id
GROUP BY cat.id, cat.nombre;

-- Vista: Usuarios activos con historial de compras
CREATE VIEW v_usuarios_con_compras AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.estado,
    COUNT(c.id) as total_compras,
    SUM(c.total) as monto_total_gastado,
    MAX(c.fecha) as ultima_compra
FROM usuarios u
LEFT JOIN compras c ON u.id = c.usuario_id AND c.estado_compra = 'entregada'
WHERE u.estado = 'activo'
GROUP BY u.id;


-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

-- Tabla: usuarios
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema. Almacena información de clientes, administradores y usuarios root.';
COMMENT ON COLUMN usuarios.email IS 'Email único del usuario, utilizado para login.';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt o similar de la contraseña. NUNCA almacenar contraseñas en texto plano.';
COMMENT ON COLUMN usuarios.estado IS 'Estado actual del usuario: activo, inactivo, suspendido.';

-- Tabla: libros
COMMENT ON TABLE libros IS 'Catálogo principal de libros disponibles en la plataforma.';
COMMENT ON COLUMN libros.stock_general IS 'Stock total del libro considerando todas las tiendas.';
COMMENT ON COLUMN libros.isbn IS 'Código ISBN internacional único del libro.';

-- Tabla: tiendas
COMMENT ON TABLE tiendas IS 'Sucursales físicas de la librería con ubicación y horario.';

-- Tabla: inventario_tienda
COMMENT ON TABLE inventario_tienda IS 'Control de inventario independiente por tienda. Relación muchos a muchos entre tiendas y libros.';

-- Tabla: compras y compra_items
COMMENT ON TABLE compras IS 'Registra las transacciones de compra de los usuarios.';
COMMENT ON TABLE compra_items IS 'Items individuales dentro de cada compra. Permite historial de precios en el momento de la compra.';

-- Tabla: pagos
COMMENT ON TABLE pagos IS 'Registro de transacciones de pago asociadas a compras.';
COMMENT ON COLUMN pagos.estado_pago IS 'Estado actual del pago: de utili para conciliación con pasarelas de pago.';

COMMIT;

-- ============================================================================
-- Cambios a logica de base de datos
-- ============================================================================
ALTER TABLE compras 
DROP CONSTRAINT compras_usuario_id_fkey;

ALTER TABLE compras 
ADD CONSTRAINT compras_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE noticias
DROP CONSTRAINT noticias_creado_por_fkey;

ALTER TABLE noticias
ADD CONSTRAINT noticias_creado_por_fkey
FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL;