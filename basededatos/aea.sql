--
-- PostgreSQL database dump
--

\restrict Jt3ucjLU94RcJSiz5MTTFrIdTRm64kQbrsyjOVcfbWbkdgcfgd9o6da4EH2JEOR

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-25 17:13:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 883 (class 1247 OID 32822)
-- Name: estado_revision_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_revision_enum AS ENUM (
    'pendiente',
    'en_progreso',
    'dictaminado'
);


ALTER TYPE public.estado_revision_enum OWNER TO postgres;

--
-- TOC entry 877 (class 1247 OID 32794)
-- Name: estado_solicitud_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_solicitud_enum AS ENUM (
    'borrador',
    'pendiente_pago',
    'en_revision',
    'observado',
    'subsanado',
    'aprobado',
    'rechazado',
    'enviado'
);


ALTER TYPE public.estado_solicitud_enum OWNER TO postgres;

--
-- TOC entry 871 (class 1247 OID 32782)
-- Name: estado_usuario_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_usuario_enum AS ENUM (
    'activo',
    'inactivo'
);


ALTER TYPE public.estado_usuario_enum OWNER TO postgres;

--
-- TOC entry 886 (class 1247 OID 32830)
-- Name: resultado_dictamen_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.resultado_dictamen_enum AS ENUM (
    'aprobado',
    'observado',
    'rechazado'
);


ALTER TYPE public.resultado_dictamen_enum OWNER TO postgres;

--
-- TOC entry 868 (class 1247 OID 32770)
-- Name: rol_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rol_enum AS ENUM (
    'investigador',
    'revisor',
    'secretario',
    'presidente',
    'admin'
);


ALTER TYPE public.rol_enum OWNER TO postgres;

--
-- TOC entry 880 (class 1247 OID 32810)
-- Name: tipo_anexo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_anexo_enum AS ENUM (
    'proyecto',
    'consentimiento',
    'instrumento',
    'voucher',
    'subsanacion'
);


ALTER TYPE public.tipo_anexo_enum OWNER TO postgres;

--
-- TOC entry 889 (class 1247 OID 32838)
-- Name: tipo_documento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_documento_enum AS ENUM (
    'constancia_aprobacion',
    'carta_observacion'
);


ALTER TYPE public.tipo_documento_enum OWNER TO postgres;

--
-- TOC entry 874 (class 1247 OID 32788)
-- Name: tipo_investigacion_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_investigacion_enum AS ENUM (
    'humanos',
    'animales',
    'datos_secundarios'
);


ALTER TYPE public.tipo_investigacion_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 32940)
-- Name: asignaciones_revision; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asignaciones_revision (
    id integer NOT NULL,
    solicitud_id integer NOT NULL,
    revisor_id integer NOT NULL,
    estado_revision public.estado_revision_enum DEFAULT 'pendiente'::public.estado_revision_enum,
    fecha_asignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asignaciones_revision OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 32939)
-- Name: asignaciones_revision_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asignaciones_revision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asignaciones_revision_id_seq OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 227
-- Name: asignaciones_revision_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asignaciones_revision_id_seq OWNED BY public.asignaciones_revision.id;


--
-- TOC entry 235 (class 1259 OID 49173)
-- Name: avisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avisos (
    id integer NOT NULL,
    tipo character varying(50),
    color character varying(20),
    fecha character varying(50),
    titulo text,
    texto text,
    imagen_url text,
    activo boolean DEFAULT true
);


ALTER TABLE public.avisos OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 49172)
-- Name: avisos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avisos_id_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 234
-- Name: avisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avisos_id_seq OWNED BY public.avisos.id;


--
-- TOC entry 233 (class 1259 OID 49152)
-- Name: configuracion_portal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion_portal (
    clave character varying(50) NOT NULL,
    valor text NOT NULL
);


ALTER TABLE public.configuracion_portal OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 32962)
-- Name: dictamenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dictamenes (
    id integer NOT NULL,
    asignacion_id integer NOT NULL,
    resultado public.resultado_dictamen_enum NOT NULL,
    comentarios_investigador text,
    comentarios_internos text,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dictamenes OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 32961)
-- Name: dictamenes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dictamenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dictamenes_id_seq OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 229
-- Name: dictamenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dictamenes_id_seq OWNED BY public.dictamenes.id;


--
-- TOC entry 226 (class 1259 OID 32913)
-- Name: documentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documentos (
    id integer NOT NULL,
    solicitud_id integer NOT NULL,
    tipo_anexo public.tipo_anexo_enum NOT NULL,
    nombre_archivo_original character varying(255) NOT NULL,
    ruta_archivo character varying(255) NOT NULL,
    version integer DEFAULT 1,
    subido_por integer NOT NULL,
    fecha_subida timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documentos OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 32912)
-- Name: documentos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documentos_id_seq OWNER TO postgres;

--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 225
-- Name: documentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documentos_id_seq OWNED BY public.documentos.id;


--
-- TOC entry 232 (class 1259 OID 32980)
-- Name: resoluciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resoluciones (
    id integer NOT NULL,
    solicitud_id integer NOT NULL,
    tipo_documento public.tipo_documento_enum NOT NULL,
    numero_resolucion character varying(100) NOT NULL,
    pdf_generado_ruta character varying(255) NOT NULL,
    emitido_por integer NOT NULL,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resoluciones OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 32979)
-- Name: resoluciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resoluciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resoluciones_id_seq OWNER TO postgres;

--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 231
-- Name: resoluciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resoluciones_id_seq OWNED BY public.resoluciones.id;


--
-- TOC entry 224 (class 1259 OID 32891)
-- Name: solicitud_historial_estados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitud_historial_estados (
    id integer NOT NULL,
    solicitud_id integer NOT NULL,
    estado_anterior character varying(50),
    estado_nuevo character varying(50) NOT NULL,
    cambiado_por integer NOT NULL,
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.solicitud_historial_estados OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 32890)
-- Name: solicitud_historial_estados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitud_historial_estados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitud_historial_estados_id_seq OWNER TO postgres;

--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 223
-- Name: solicitud_historial_estados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitud_historial_estados_id_seq OWNED BY public.solicitud_historial_estados.id;


--
-- TOC entry 222 (class 1259 OID 32867)
-- Name: solicitudes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes (
    id integer NOT NULL,
    numero_expediente character varying(50) NOT NULL,
    investigador_id integer NOT NULL,
    tipo_investigacion public.tipo_investigacion_enum NOT NULL,
    titulo_proyecto text NOT NULL,
    estado_actual public.estado_solicitud_enum DEFAULT 'borrador'::public.estado_solicitud_enum,
    fecha_envio timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comentarios_comite text,
    revisor_id integer
);


ALTER TABLE public.solicitudes OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 32866)
-- Name: solicitudes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitudes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 221
-- Name: solicitudes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitudes_id_seq OWNED BY public.solicitudes.id;


--
-- TOC entry 220 (class 1259 OID 32844)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    dni character varying(8) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    correo_institucional character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol public.rol_enum NOT NULL,
    facultad character varying(150),
    estado public.estado_usuario_enum DEFAULT 'activo'::public.estado_usuario_enum,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 32843)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4932 (class 2604 OID 32943)
-- Name: asignaciones_revision id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignaciones_revision ALTER COLUMN id SET DEFAULT nextval('public.asignaciones_revision_id_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 49176)
-- Name: avisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avisos ALTER COLUMN id SET DEFAULT nextval('public.avisos_id_seq'::regclass);


--
-- TOC entry 4935 (class 2604 OID 32965)
-- Name: dictamenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictamenes ALTER COLUMN id SET DEFAULT nextval('public.dictamenes_id_seq'::regclass);


--
-- TOC entry 4929 (class 2604 OID 32916)
-- Name: documentos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos ALTER COLUMN id SET DEFAULT nextval('public.documentos_id_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 32983)
-- Name: resoluciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resoluciones ALTER COLUMN id SET DEFAULT nextval('public.resoluciones_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 32894)
-- Name: solicitud_historial_estados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_historial_estados ALTER COLUMN id SET DEFAULT nextval('public.solicitud_historial_estados_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 32870)
-- Name: solicitudes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 32847)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 5136 (class 0 OID 32940)
-- Dependencies: 228
-- Data for Name: asignaciones_revision; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asignaciones_revision (id, solicitud_id, revisor_id, estado_revision, fecha_asignacion) FROM stdin;
\.


--
-- TOC entry 5143 (class 0 OID 49173)
-- Dependencies: 235
-- Data for Name: avisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avisos (id, tipo, color, fecha, titulo, texto, imagen_url, activo) FROM stdin;
1	Informativo	green	24 de mayo de 2026	 vf wrw	rwrwrw	\N	t
2	Cronograma	red	24 de mayo de 2026	rgete	etetette	\N	t
\.


--
-- TOC entry 5141 (class 0 OID 49152)
-- Dependencies: 233
-- Data for Name: configuracion_portal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracion_portal (clave, valor) FROM stdin;
video_url	https://www.youtube.com/watch?v=sfDngR7Lo4w&list=RDsfDngR7Lo4w&start_radio=1
\.


--
-- TOC entry 5138 (class 0 OID 32962)
-- Dependencies: 230
-- Data for Name: dictamenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dictamenes (id, asignacion_id, resultado, comentarios_investigador, comentarios_internos, fecha_emision) FROM stdin;
\.


--
-- TOC entry 5134 (class 0 OID 32913)
-- Dependencies: 226
-- Data for Name: documentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documentos (id, solicitud_id, tipo_anexo, nombre_archivo_original, ruta_archivo, version, subido_por, fecha_subida) FROM stdin;
1	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498002906-678958891.pdf	1	1	2026-05-22 20:00:03.007648
2	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498014430-481382512.pdf	1	1	2026-05-22 20:00:14.524243
3	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498015412-865067368.pdf	1	1	2026-05-22 20:00:15.416558
4	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498037959-657369978.pdf	1	1	2026-05-22 20:00:38.043447
5	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498038924-384768497.pdf	1	1	2026-05-22 20:00:38.927088
6	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498039686-452039567.pdf	1	1	2026-05-22 20:00:39.689297
7	1	proyecto	DOCUMENTO DE REQUERIMIENTOS DEL SISTEMA.pdf	uploads\\documentos\\1779498310098-869186737.pdf	1	1	2026-05-22 20:05:10.28369
8	2	proyecto	]Sistema Inteligente de Consulta Legal basado en RecuperaciÃ³n Aumentada[FU]2.docx	uploads\\documentos\\1779500044228-5056828.docx	1	1	2026-05-22 20:34:04.329038
9	1	consentimiento	Sistema Inteligente de Consulta Legal basado en RecuperaciÃ³n Aumentada[FU]1.pdf	uploads\\documentos\\1779500453341-448666789.pdf	1	1	2026-05-22 20:40:53.434913
10	3	consentimiento	Proyecto_Tesis_GeoIA_Puno_FINESI_v2 (1).docx	uploads\\documentos\\1779500494290-58172180.docx	1	1	2026-05-22 20:41:34.388385
11	3	consentimiento	IA_Borrador.docx	uploads\\documentos\\1779500645416-889941731.docx	1	1	2026-05-22 20:44:05.495152
12	3	consentimiento	IA_Borrador.docx	uploads\\documentos\\1779500725256-390353389.docx	1	1	2026-05-22 20:45:25.344895
13	5	proyecto	Taller de Tesis_Ejercicio02.doc	uploads\\documentos\\1779501044913-843813520.doc	1	1	2026-05-22 20:50:44.916155
14	4	proyecto	IA.docx	uploads\\documentos\\1779554507926-114583279.docx	1	1	2026-05-23 11:41:47.933012
15	6	proyecto	Sistema Inteligente de Consulta Legal basado en RecuperaciÃ³n Aumentada[FU]2.pdf	uploads\\documentos\\1779558050962-377872582.pdf	1	4	2026-05-23 12:40:50.967969
16	7	proyecto	Rubrica_Evaluacion_Resumen_ONTA2026.pdf	uploads\\documentos\\1779559678129-844369801.pdf	1	4	2026-05-23 13:07:58.133706
\.


--
-- TOC entry 5140 (class 0 OID 32980)
-- Dependencies: 232
-- Data for Name: resoluciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resoluciones (id, solicitud_id, tipo_documento, numero_resolucion, pdf_generado_ruta, emitido_por, fecha_emision) FROM stdin;
\.


--
-- TOC entry 5132 (class 0 OID 32891)
-- Dependencies: 224
-- Data for Name: solicitud_historial_estados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitud_historial_estados (id, solicitud_id, estado_anterior, estado_nuevo, cambiado_por, fecha_cambio) FROM stdin;
\.


--
-- TOC entry 5130 (class 0 OID 32867)
-- Dependencies: 222
-- Data for Name: solicitudes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes (id, numero_expediente, investigador_id, tipo_investigacion, titulo_proyecto, estado_actual, fecha_envio, created_at, updated_at, comentarios_comite, revisor_id) FROM stdin;
1	CIEI-2026-7119	1	humanos	Análisis del mercado turístico en la región de Puno antes, durante y después de la pandemia de COVID-19	borrador	\N	2026-05-22 19:41:27.552003	2026-05-22 19:41:27.552003	\N	\N
2	CIEI-2026-4727	1	animales	qwe	borrador	\N	2026-05-22 20:29:14.178635	2026-05-22 20:29:14.178635	\N	\N
3	CIEI-2026-7472	1	humanos	hola m,rd 	borrador	\N	2026-05-22 20:41:19.924978	2026-05-22 20:41:19.924978	\N	\N
5	CIEI-2026-6055	1	humanos	aaA	rechazado	\N	2026-05-22 20:50:33.787188	2026-05-22 20:50:33.787188	\N	\N
4	CIEI-2026-5811	1	animales	qwd	observado	\N	2026-05-22 20:50:23.455427	2026-05-22 20:50:23.455427	alta actualizar la matriz BCG en el capítulo 3	\N
6	CIEI-2026-6008	4	animales	eqwe	observado	\N	2026-05-23 12:40:44.340924	2026-05-23 12:40:44.340924	es una mrd este proyecto 	\N
7	CIEI-2026-4871	4	humanos	hola	aprobado	\N	2026-05-23 13:07:48.967653	2026-05-23 13:07:48.967653	\N	7
8	CIEI-2026-3246	4	animales	Impacto de la IA en la educación en Puno	borrador	\N	2026-05-23 14:37:25.953146	2026-05-23 14:37:25.953146	\N	\N
9	CIEI-2026-8315	4	humanos	kñ	borrador	\N	2026-05-23 14:52:53.042332	2026-05-23 14:52:53.042332	\N	\N
10	CIEI-2026-7637	4	datos_secundarios	hola 	borrador	\N	2026-05-23 14:55:06.103919	2026-05-23 14:55:06.103919	\N	\N
11	CIEI-2026-6246	9	humanos	aea	borrador	\N	2026-05-24 20:28:43.144786	2026-05-24 20:28:43.144786	\N	\N
\.


--
-- TOC entry 5128 (class 0 OID 32844)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad, estado, created_at, updated_at) FROM stdin;
1	12345678	Eduardo	Admin	admin@unap.edu.pe	$2b$10$M7ZnUh13nTCzPJxeyky4tOL9YsGFY/ttchSJipAEe2DYNjr4HWTr.	admin	Ingeniería Estadística e Informática	activo	2026-05-22 19:22:37.323671	2026-05-22 19:22:37.323671
4	87654321	Eduardo	Investigador	investigador@unap.edu.pe	$2b$10$M7ZnUh13nTCzPJxeyky4tOL9YsGFY/ttchSJipAEe2DYNjr4HWTr.	investigador	\N	activo	2026-05-23 12:39:36.839443	2026-05-23 12:39:36.839443
5	11111111	Ana	Secretaria	secretaria@unap.edu.pe	$2b$10$M7ZnUh13nTCzPJxeyky4tOL9YsGFY/ttchSJipAEe2DYNjr4HWTr.	secretario	\N	activo	2026-05-23 13:00:23.865577	2026-05-23 13:00:23.865577
8	77694196	eduardo	lopez 	eduardobox2@gmail.com	$2b$10$1PazozX0fIPaCAVECUPXSenvVbDPuedmTA3JWSh0ZJxfuEKu4zdJ2	secretario	\N	activo	2026-05-23 14:23:34.392647	2026-05-23 14:23:34.392647
9	02374733	LUCILA	LOPEZ QUISPE	lopezchoquechambie@gmail.com	$2b$10$megECw1BnyrzASLuYkQC8OH/qGffIaeGHYTGBfCjDn7VuvUfteodW	presidente	No especificada	activo	2026-05-24 20:24:58.489981	2026-05-24 20:24:58.489981
7	33333333	Dra. María	Revisora	revisor@unap.edu.pe	$2b$10$M7ZnUh13nTCzPJxeyky4tOL9YsGFY/ttchSJipAEe2DYNjr4HWTr.	admin	\N	activo	2026-05-23 13:00:23.865577	2026-05-23 13:00:23.865577
6	22222222	Dr. Carlos	Presidente	presidente@unap.edu.pe	$2b$10$M7ZnUh13nTCzPJxeyky4tOL9YsGFY/ttchSJipAEe2DYNjr4HWTr.	investigador	\N	activo	2026-05-23 13:00:23.865577	2026-05-23 13:00:23.865577
\.


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 227
-- Name: asignaciones_revision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asignaciones_revision_id_seq', 1, false);


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 234
-- Name: avisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.avisos_id_seq', 2, true);


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 229
-- Name: dictamenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dictamenes_id_seq', 1, false);


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 225
-- Name: documentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documentos_id_seq', 16, true);


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 231
-- Name: resoluciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resoluciones_id_seq', 1, false);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 223
-- Name: solicitud_historial_estados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitud_historial_estados_id_seq', 1, false);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 221
-- Name: solicitudes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_id_seq', 11, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 9, true);


--
-- TOC entry 4956 (class 2606 OID 32950)
-- Name: asignaciones_revision asignaciones_revision_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignaciones_revision
    ADD CONSTRAINT asignaciones_revision_pkey PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 49182)
-- Name: avisos avisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avisos
    ADD CONSTRAINT avisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 49160)
-- Name: configuracion_portal configuracion_portal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_portal
    ADD CONSTRAINT configuracion_portal_pkey PRIMARY KEY (clave);


--
-- TOC entry 4958 (class 2606 OID 32973)
-- Name: dictamenes dictamenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictamenes
    ADD CONSTRAINT dictamenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4954 (class 2606 OID 32928)
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 32996)
-- Name: resoluciones resoluciones_numero_resolucion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resoluciones
    ADD CONSTRAINT resoluciones_numero_resolucion_key UNIQUE (numero_resolucion);


--
-- TOC entry 4962 (class 2606 OID 32992)
-- Name: resoluciones resoluciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resoluciones
    ADD CONSTRAINT resoluciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4964 (class 2606 OID 32994)
-- Name: resoluciones resoluciones_solicitud_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resoluciones
    ADD CONSTRAINT resoluciones_solicitud_id_key UNIQUE (solicitud_id);


--
-- TOC entry 4952 (class 2606 OID 32901)
-- Name: solicitud_historial_estados solicitud_historial_estados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_historial_estados
    ADD CONSTRAINT solicitud_historial_estados_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 32884)
-- Name: solicitudes solicitudes_numero_expediente_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_numero_expediente_key UNIQUE (numero_expediente);


--
-- TOC entry 4950 (class 2606 OID 32882)
-- Name: solicitudes solicitudes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 32865)
-- Name: usuarios usuarios_correo_institucional_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_institucional_key UNIQUE (correo_institucional);


--
-- TOC entry 4944 (class 2606 OID 32863)
-- Name: usuarios usuarios_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_dni_key UNIQUE (dni);


--
-- TOC entry 4946 (class 2606 OID 32861)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4975 (class 2606 OID 32956)
-- Name: asignaciones_revision asignaciones_revision_revisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignaciones_revision
    ADD CONSTRAINT asignaciones_revision_revisor_id_fkey FOREIGN KEY (revisor_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4976 (class 2606 OID 32951)
-- Name: asignaciones_revision asignaciones_revision_solicitud_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignaciones_revision
    ADD CONSTRAINT asignaciones_revision_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id);


--
-- TOC entry 4977 (class 2606 OID 32974)
-- Name: dictamenes dictamenes_asignacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dictamenes
    ADD CONSTRAINT dictamenes_asignacion_id_fkey FOREIGN KEY (asignacion_id) REFERENCES public.asignaciones_revision(id);


--
-- TOC entry 4973 (class 2606 OID 32929)
-- Name: documentos documentos_solicitud_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id);


--
-- TOC entry 4974 (class 2606 OID 32934)
-- Name: documentos documentos_subido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_subido_por_fkey FOREIGN KEY (subido_por) REFERENCES public.usuarios(id);


--
-- TOC entry 4978 (class 2606 OID 33002)
-- Name: resoluciones resoluciones_emitido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resoluciones
    ADD CONSTRAINT resoluciones_emitido_por_fkey FOREIGN KEY (emitido_por) REFERENCES public.usuarios(id);


--
-- TOC entry 4979 (class 2606 OID 32997)
-- Name: resoluciones resoluciones_solicitud_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resoluciones
    ADD CONSTRAINT resoluciones_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id);


--
-- TOC entry 4971 (class 2606 OID 32907)
-- Name: solicitud_historial_estados solicitud_historial_estados_cambiado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_historial_estados
    ADD CONSTRAINT solicitud_historial_estados_cambiado_por_fkey FOREIGN KEY (cambiado_por) REFERENCES public.usuarios(id);


--
-- TOC entry 4972 (class 2606 OID 32902)
-- Name: solicitud_historial_estados solicitud_historial_estados_solicitud_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_historial_estados
    ADD CONSTRAINT solicitud_historial_estados_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id);


--
-- TOC entry 4969 (class 2606 OID 32885)
-- Name: solicitudes solicitudes_investigador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_investigador_id_fkey FOREIGN KEY (investigador_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4970 (class 2606 OID 40960)
-- Name: solicitudes solicitudes_revisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_revisor_id_fkey FOREIGN KEY (revisor_id) REFERENCES public.usuarios(id);


-- Completed on 2026-05-25 17:13:43

--
-- PostgreSQL database dump complete
--

\unrestrict Jt3ucjLU94RcJSiz5MTTFrIdTRm64kQbrsyjOVcfbWbkdgcfgd9o6da4EH2JEOR

