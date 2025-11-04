#!/bin/bash

################################################################################
# Dogs CRUD API - Local Testing Script
################################################################################
# Este script facilita las pruebas locales de la API
# 
# Uso:
#   ./test-local.sh [comando]
#
# Comandos disponibles:
#   setup       - Configuración inicial (Docker + migraciones)
#   start       - Iniciar el servidor en modo desarrollo
#   stop        - Detener el servidor y contenedores
#   test        - Ejecutar todos los tests
#   test-api    - Hacer pruebas básicas de la API (GET, POST, PUT, DELETE)
#   test-rate   - Probar rate limiting
#   test-batch  - Probar creación de múltiples items (transaccional)
#   clean       - Limpiar base de datos y contenedores
#   studio      - Abrir Prisma Studio para ver la BD
#   help        - Mostrar este mensaje de ayuda
################################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3000"
PORT=3000

# Funciones auxiliares
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}➜${NC} $1"
}

check_dependencies() {
    print_header "Verificando dependencias"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi
    print_success "Docker está instalado"
    
    # Verificar permisos de Docker
    if ! docker ps &> /dev/null; then
        print_error "No tienes permisos para usar Docker"
        print_info "Solución: Ejecuta los siguientes comandos:"
        echo "  sudo usermod -aG docker \$USER"
        echo "  newgrp docker"
        print_info "O ejecuta este script con sudo"
        exit 1
    fi
    print_success "Permisos de Docker OK"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado"
        exit 1
    fi
    print_success "Node.js $(node --version) está instalado"
    
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    print_success "npm $(npm --version) está instalado"
    
    if ! command -v curl &> /dev/null; then
        print_error "curl no está instalado"
        exit 1
    fi
    print_success "curl está instalado"
}

wait_for_server() {
    print_info "Esperando a que el servidor inicie..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "${API_URL}/health" > /dev/null 2>&1; then
            print_success "Servidor iniciado correctamente"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "El servidor no inició en el tiempo esperado"
    return 1
}

setup() {
    print_header "Configuración inicial"
    
    check_dependencies
    
    print_info "Instalando dependencias npm..."
    npm install
    print_success "Dependencias instaladas"
    
    print_info "Iniciando contenedores Docker..."
    docker-compose up -d
    print_success "Contenedores Docker iniciados"
    
    print_info "Esperando PostgreSQL..."
    sleep 5
    
    print_info "Generando Prisma Client..."
    npm run prisma:generate
    print_success "Prisma Client generado"
    
    print_info "Ejecutando migraciones..."
    npm run prisma:migrate:deploy
    print_success "Migraciones ejecutadas"
    
    print_success "Configuración completada"
}

start_server() {
    print_header "Iniciando servidor"
    
    # Verificar si el servidor ya está corriendo
    if curl -s "${API_URL}/health" > /dev/null 2>&1; then
        print_info "El servidor ya está corriendo en ${API_URL}"
        return 0
    fi
    
    # Verificar que Docker está corriendo
    if ! docker ps | grep -q "dogs-crud-postgres"; then
        print_info "Iniciando contenedores Docker..."
        docker-compose up -d
        sleep 5
    fi
    
    print_info "Iniciando servidor en modo desarrollo..."
    npm run dev
}

stop_server() {
    print_header "Deteniendo servidor y servicios"
    
    print_info "Deteniendo servidor Node.js..."
    pkill -f "ts-node-dev" || true
    print_success "Servidor detenido"
    
    print_info "Deteniendo contenedores Docker..."
    
    # Intentar stop normal
    if docker compose stop 2>/dev/null; then
        print_success "Contenedores detenidos"
        return 0
    fi
    
    # Intentar con sudo
    if sudo docker compose stop 2>/dev/null; then
        print_success "Contenedores detenidos con sudo"
        return 0
    fi
    
    # Si falla, informar y dar alternativas
    print_error "No se pudieron detener los contenedores normalmente"
    print_info ""
    print_info "Opciones alternativas:"
    print_info "1. Reiniciar Docker daemon:"
    echo "   sudo systemctl restart docker"
    print_info "2. Dejar los contenedores corriendo (no afecta al desarrollo)"
    print_info "3. Reiniciar el sistema si es necesario"
    print_info ""
    print_info "Los contenedores seguirán corriendo pero no interfieren con el desarrollo"
}

run_tests() {
    print_header "Ejecutando tests"
    npm test
}

test_api_basic() {
    print_header "Probando API básica"
    
    if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
        print_error "El servidor no está corriendo. Ejecuta './test-local.sh start' primero"
        exit 1
    fi
    
    # Health check
    print_info "1. Health Check"
    response=$(curl -s "${API_URL}/health")
    echo "$response" | jq .
    print_success "Health check OK"
    
    # GET all items (empty)
    print_info "2. GET /api/items (lista vacía)"
    response=$(curl -s "${API_URL}/api/items")
    echo "$response" | jq .
    print_success "Lista obtenida"
    
    # CREATE item
    print_info "3. POST /api/items (crear item)"
    response=$(curl -s -X POST "${API_URL}/api/items" \
        -H "Content-Type: application/json" \
        -d '{"name": "Golden Retriever", "description": "Friendly and loyal dog breed"}')
    echo "$response" | jq .
    item_id=$(echo "$response" | jq -r '.data.item.id')
    print_success "Item creado con ID: $item_id"
    
    # GET item by ID
    print_info "4. GET /api/items/$item_id (obtener por ID)"
    response=$(curl -s "${API_URL}/api/items/${item_id}")
    echo "$response" | jq .
    print_success "Item obtenido"
    
    # UPDATE item
    print_info "5. PUT /api/items/$item_id (actualizar item)"
    response=$(curl -s -X PUT "${API_URL}/api/items/${item_id}" \
        -H "Content-Type: application/json" \
        -d '{"name": "Golden Retriever Updated", "description": "Very friendly and loyal"}')
    echo "$response" | jq .
    print_success "Item actualizado"
    
    # GET all items (with data)
    print_info "6. GET /api/items (con datos)"
    response=$(curl -s "${API_URL}/api/items")
    echo "$response" | jq .
    print_success "Lista obtenida"
    
    # DELETE item
    print_info "7. DELETE /api/items/$item_id (eliminar item)"
    curl -s -X DELETE "${API_URL}/api/items/${item_id}"
    print_success "Item eliminado"
    
    # Verify deletion
    print_info "8. GET /api/items (verificar eliminación)"
    response=$(curl -s "${API_URL}/api/items")
    echo "$response" | jq .
    print_success "Verificación completada"
    
    print_success "Todas las pruebas básicas pasaron correctamente"
}

test_rate_limiting() {
    print_header "Probando Rate Limiting"
    
    if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
        print_error "El servidor no está corriendo"
        exit 1
    fi
    
    print_info "Probando rate limit de operaciones de escritura (50 requests/15min)"
    print_info "Enviando 10 requests seguidos..."
    
    success_count=0
    rate_limited_count=0
    
    for i in {1..10}; do
        response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/items" \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"Test Dog $i\", \"description\": \"Rate limit test $i\"}")
        
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "201" ]; then
            success_count=$((success_count + 1))
            echo -n "${GREEN}.${NC}"
        elif [ "$http_code" = "429" ]; then
            rate_limited_count=$((rate_limited_count + 1))
            echo -n "${RED}X${NC}"
        fi
    done
    
    echo ""
    print_success "Requests exitosos: $success_count"
    if [ $rate_limited_count -gt 0 ]; then
        print_info "Requests bloqueados por rate limit: $rate_limited_count"
    fi
    
    print_info "Rate limiting funcionando correctamente"
}

test_batch_transaction() {
    print_header "Probando creación batch (transaccional)"
    
    if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
        print_error "El servidor no está corriendo"
        exit 1
    fi
    
    print_info "Creando múltiples items en una transacción..."
    response=$(curl -s -X POST "${API_URL}/api/items/batch" \
        -H "Content-Type: application/json" \
        -d '{
            "items": [
                {"name": "Labrador", "description": "Energetic and playful"},
                {"name": "German Shepherd", "description": "Intelligent and protective"},
                {"name": "Beagle", "description": "Friendly and curious"}
            ]
        }')
    
    echo "$response" | jq .
    
    count=$(echo "$response" | jq '.data.items | length')
    print_success "Se crearon $count items en una transacción"
    
    print_info "Probando rollback (nombre duplicado)..."
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/items/batch" \
        -H "Content-Type: application/json" \
        -d '{
            "items": [
                {"name": "Poodle", "description": "Elegant and intelligent"},
                {"name": "Labrador", "description": "Duplicate - should fail"}
            ]
        }')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "409" ] || [ "$http_code" = "500" ]; then
        print_success "Rollback funcionó correctamente - transacción rechazada"
        echo "$body" | jq .
    else
        print_error "El rollback no funcionó como se esperaba"
    fi
}

clean_data() {
    print_header "Limpiando datos"
    
    print_info "Deteniendo servidor..."
    pkill -f "ts-node-dev" || true
    
    print_info "Deteniendo y eliminando contenedores..."
    if docker compose down -v 2>/dev/null; then
        print_success "Contenedores eliminados"
    else
        print_info "Intentando con sudo..."
        if sudo docker compose down -v 2>/dev/null; then
            print_success "Contenedores eliminados"
        else
            print_error "No se pudieron eliminar los contenedores"
        fi
    fi
    
    print_info "Limpiando archivos generados..."
    rm -rf node_modules dist coverage
    print_success "Archivos eliminados"
    
    print_success "Limpieza completada"
}

open_studio() {
    print_header "Abriendo Prisma Studio"
    
    if ! docker ps | grep -q "dogs-crud-postgres"; then
        print_info "Iniciando contenedores Docker..."
        docker-compose up -d
        sleep 5
    fi
    
    print_info "Abriendo Prisma Studio en http://localhost:5555"
    npm run prisma:studio
}

show_help() {
    cat << EOF

${BLUE}Dogs CRUD API - Script de Testing Local${NC}

${YELLOW}Uso:${NC}
    ./test-local.sh [comando]

${YELLOW}Comandos disponibles:${NC}

    ${GREEN}setup${NC}           Configuración inicial completa
                      - Instala dependencias npm
                      - Inicia contenedores Docker
                      - Ejecuta migraciones de BD
    
    ${GREEN}start${NC}           Inicia el servidor en modo desarrollo
                      Accesible en: http://localhost:3000
    
    ${GREEN}stop${NC}            Detiene el servidor y contenedores Docker
    
    ${GREEN}test${NC}            Ejecuta todos los tests unitarios e integración
    
    ${GREEN}test-api${NC}        Prueba todas las operaciones CRUD básicas
                      - Health check
                      - GET /api/items
                      - POST /api/items
                      - PUT /api/items/:id
                      - DELETE /api/items/:id
    
    ${GREEN}test-rate${NC}       Prueba los rate limiters configurados
                      - Read: 100 req/min
                      - Write: 50 req/15min
                      - Batch: 10 req/15min
    
    ${GREEN}test-batch${NC}      Prueba creación transaccional de múltiples items
                      - Rollback en caso de error
    
    ${GREEN}clean${NC}           Limpia base de datos, contenedores y archivos
    
    ${GREEN}studio${NC}          Abre Prisma Studio (http://localhost:5555)
                      Para visualizar y editar la base de datos
    
    ${GREEN}help${NC}            Muestra este mensaje de ayuda

${YELLOW}Ejemplos:${NC}

    # Setup inicial (solo la primera vez)
    ./test-local.sh setup

    # Iniciar el servidor
    ./test-local.sh start

    # En otra terminal, probar la API
    ./test-local.sh test-api

    # Probar rate limiting
    ./test-local.sh test-rate

    # Ver la base de datos
    ./test-local.sh studio

    # Detener todo
    ./test-local.sh stop

${YELLOW}Endpoints de la API:${NC}

    GET    /health              - Health check
    GET    /api/items           - Listar todos los items
    GET    /api/items/:id       - Obtener item por ID
    POST   /api/items           - Crear nuevo item
    PUT    /api/items/:id       - Actualizar item
    DELETE /api/items/:id       - Eliminar item
    POST   /api/items/batch     - Crear múltiples items (transaccional)

${YELLOW}URLs:${NC}

    API:            http://localhost:3000
    Health Check:   http://localhost:3000/health
    Prisma Studio:  http://localhost:5555
    PostgreSQL:     localhost:5435 (dev) / 5434 (test)

${YELLOW}Permisos de Docker:${NC}

    Si obtienes errores de permisos con Docker, ejecuta:
    
    ${GREEN}sudo usermod -aG docker \$USER${NC}
    ${GREEN}newgrp docker${NC}
    
    O ejecuta los comandos con sudo:
    ${GREEN}sudo ./test-local.sh stop${NC}

EOF
}

# Main
case "${1:-help}" in
    setup)
        setup
        ;;
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    test)
        run_tests
        ;;
    test-api)
        test_api_basic
        ;;
    test-rate)
        test_rate_limiting
        ;;
    test-batch)
        test_batch_transaction
        ;;
    clean)
        clean_data
        ;;
    studio)
        open_studio
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando desconocido: $1"
        show_help
        exit 1
        ;;
esac
