// Sistema de gestión de reservas de cine
let cine = {
    nombre: 'Hoyts',
    salas: {
        'A': {
            nombre: 'Sala A - IMAX',
            capacidad: 40,
            filas: ['a', 'b', 'c', 'd', 'e'],
            asientosPorFila: 8,
            asientos: {},
            precio: 12000
        },
        'B': {
            nombre: 'Sala B - Premium',
            capacidad: 50,
            filas: ['a', 'b', 'c', 'd', 'e'],
            asientosPorFila: 10,
            asientos: {},
            precio: 15000
        },
        'C': {
            nombre: 'Sala C - Tradicional',
            capacidad: 45,
            filas: ['a', 'b', 'c', 'd', 'e'],
            asientosPorFila: 9,
            asientos: {},
            precio: 8000
        }
    },
    
    // Variables globales
    currentHall: null,
    selectedSeats: [],
    
    // Generar asientos
    generarAsientos() {
        for (let salaId in this.salas) {
            let sala = this.salas[salaId];
            
            for (let fila of sala.filas) {
                for (let numeroAsiento = 1; numeroAsiento <= sala.asientosPorFila; numeroAsiento++) {
                    let asientoId = `${salaId}${fila}${numeroAsiento.toString().padStart(2, '0')}`;
                    
                    sala.asientos[asientoId] = {
                        id: asientoId,
                        disponible: true,
                        reservadoPor: null,
                        fila: fila,
                        numero: numeroAsiento,
                        displayId: `${fila.toUpperCase()}${numeroAsiento}`
                    };
                }
            }
        }
        
        // Cargar datos desde localStorage
        this.loadFromStorage();
        
        // Simular algunos asientos ocupados
        this.simularOcupados();
    },
    
    // Simular asientos ocupados
    simularOcupados() {
        const ocupados = ['Aa03', 'Aa04', 'Ab05', 'Bb01', 'Bb02', 'Cc07', 'Cc08'];
        ocupados.forEach(asientoId => {
            if (this.salas[asientoId.charAt(0)] && this.salas[asientoId.charAt(0)].asientos[asientoId]) {
                this.salas[asientoId.charAt(0)].asientos[asientoId].disponible = false;
                this.salas[asientoId.charAt(0)].asientos[asientoId].reservadoPor = 'Sistema';
            }
        });
    },
    
    // Guardar en localStorage
    saveToStorage() {
        const data = {
            asientos: {},
            selectedSeats: this.selectedSeats,
            currentHall: this.currentHall
        };
        
        for (let salaId in this.salas) {
            data.asientos[salaId] = {};
            for (let asientoId in this.salas[salaId].asientos) {
                data.asientos[salaId][asientoId] = {
                    disponible: this.salas[salaId].asientos[asientoId].disponible,
                    reservadoPor: this.salas[salaId].asientos[asientoId].reservadoPor
                };
            }
        }
        
        localStorage.setItem('cineReservas', JSON.stringify(data));
    },
    
    // Cargar desde localStorage
    loadFromStorage() {
        const data = localStorage.getItem('cineReservas');
        if (data) {
            const parsed = JSON.parse(data);
            
            // Restaurar estado de asientos
            if (parsed.asientos) {
                for (let salaId in parsed.asientos) {
                    if (this.salas[salaId]) {
                        for (let asientoId in parsed.asientos[salaId]) {
                            if (this.salas[salaId].asientos[asientoId]) {
                                this.salas[salaId].asientos[asientoId].disponible = parsed.asientos[salaId][asientoId].disponible;
                                this.salas[salaId].asientos[asientoId].reservadoPor = parsed.asientos[salaId][asientoId].reservadoPor;
                            }
                        }
                    }
                }
            }
            
            // Restaurar selección actual
            this.selectedSeats = parsed.selectedSeats || [];
            this.currentHall = parsed.currentHall;
        }
    },
    
    // Alternar selección de asiento
    toggleSeat(asientoId) {
        const asiento = this.salas[this.currentHall].asientos[asientoId];
        
        if (!asiento) return;
        
        // Si el asiento está disponible, seleccionarlo/deseleccionarlo
        if (asiento.disponible) {
            const index = this.selectedSeats.indexOf(asientoId);
            if (index > -1) {
                this.selectedSeats.splice(index, 1);
            } else {
                this.selectedSeats.push(asientoId);
            }
        }
        // Si el asiento está ocupado por el Usuario, permitir cancelar la reserva
        else if (asiento.reservadoPor === 'Usuario') {
            if (confirm(`¿Deseas cancelar la reserva del asiento ${asiento.displayId}?`)) {
                asiento.disponible = true;
                asiento.reservadoPor = null;
            }
        }
        // Si está ocupado por otro (Sistema), no hacer nada
        else {
            return;
        }
        
        this.saveToStorage();
        updateSeatDisplay();
        updateSummary();
    },
    
    // Confirmar reserva
    confirmarReserva() {
        if (this.selectedSeats.length === 0) return false;
        
        this.selectedSeats.forEach(asientoId => {
            const asiento = this.salas[this.currentHall].asientos[asientoId];
            if (asiento) {
                asiento.disponible = false;
                asiento.reservadoPor = 'Usuario';
            }
        });
        
        const reservedSeats = [...this.selectedSeats];
        this.selectedSeats = [];
        this.saveToStorage();
        
        return reservedSeats;
    }
};

// Funciones de interfaz
function showWelcome() {
    // Limpiar el estado cuando volvemos al welcome
    cine.currentHall = null;
    cine.selectedSeats = [];
    cine.saveToStorage();
    
    document.getElementById('welcome').style.display = 'block';
    document.getElementById('hallSelection').style.display = 'none';
    document.getElementById('seatSelection').style.display = 'none';
}

function showHallSelection() {
    // Limpiar la sala actual cuando volvemos a la selección
    cine.currentHall = null;
    cine.selectedSeats = [];
    cine.saveToStorage();
    
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('hallSelection').style.display = 'block';
    document.getElementById('seatSelection').style.display = 'none';
    
    generateHallCards();
}

function showSeatSelection(hallId) {
    cine.currentHall = hallId;
    cine.saveToStorage();
    
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('hallSelection').style.display = 'none';
    document.getElementById('seatSelection').style.display = 'block';
    
    document.getElementById('currentHallTitle').textContent = cine.salas[hallId].nombre;
    document.getElementById('summaryHall').textContent = cine.salas[hallId].nombre;
    
    generateSeatsMap(hallId);
    updateSummary();
}

function generateHallCards() {
    const container = document.getElementById('hallCards');
    container.innerHTML = '';
    
    for (let salaId in cine.salas) {
        const sala = cine.salas[salaId];
        let disponibles = 0;
        let total = 0;
        
        for (let asientoId in sala.asientos) {
            total++;
            if (sala.asientos[asientoId].disponible) {
                disponibles++;
            }
        }
        
        const ocupacion = ((total - disponibles) / total * 100).toFixed(0);
        
        const card = document.createElement('div');
        card.className = 'col-md-4';
        card.innerHTML = `
            <div class="hall-card card h-100 p-3" onclick="showSeatSelection('${salaId}')">
                <div class="card-body text-center">
                    <i class="fas fa-chair fa-3x text-primary mb-3"></i>
                    <h5 class="card-title">${sala.nombre}</h5>
                    <p class="card-text">
                        <span class="badge bg-success">${disponibles}</span> disponibles de 
                        <span class="badge bg-secondary">${total}</span> totales
                    </p>
                    <p class="small text-muted">Ocupación: ${ocupacion}%</p>
                    <p class="h6 text-primary">$${sala.precio.toLocaleString()}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

function generateSeatsMap(hallId) {
    const container = document.getElementById('seatsMap');
    const sala = cine.salas[hallId];
    
    container.innerHTML = '';
    
    for (let fila of sala.filas) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        
        // Etiqueta de fila
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = fila.toUpperCase();
        rowDiv.appendChild(rowLabel);
        
        // Asientos de la fila
        for (let numeroAsiento = 1; numeroAsiento <= sala.asientosPorFila; numeroAsiento++) {
            const asientoId = `${hallId}${fila}${numeroAsiento.toString().padStart(2, '0')}`;
            const asiento = sala.asientos[asientoId];
            
            const seatDiv = document.createElement('div');
            seatDiv.className = 'seat';
            seatDiv.setAttribute('data-seat-id', asientoId);
            seatDiv.textContent = numeroAsiento;
            
            // Determinar estado del asiento
            if (!asiento.disponible) {
                if (asiento.reservadoPor === 'Usuario') {
                    seatDiv.classList.add('user-occupied');
                    seatDiv.setAttribute('title', `Asiento ${asiento.displayId} - Tu reserva (clic para cancelar)`);
                } else {
                    seatDiv.classList.add('occupied');
                    seatDiv.setAttribute('title', `Asiento ${asiento.displayId} - Ocupado`);
                }
            } else if (cine.selectedSeats.includes(asientoId)) {
                seatDiv.classList.add('selected');
                seatDiv.setAttribute('title', `Asiento ${asiento.displayId} - Seleccionado`);
            } else {
                seatDiv.classList.add('available');
                seatDiv.setAttribute('title', `Asiento ${asiento.displayId} - Disponible`);
            }
            
            // Event listener - ahora todos los asientos son clicables excepto los ocupados por Sistema
            if (asiento.disponible || asiento.reservadoPor === 'Usuario') {
                seatDiv.addEventListener('click', () => {
                    cine.toggleSeat(asientoId);
                });
            }
            
            rowDiv.appendChild(seatDiv);
        }
        
        container.appendChild(rowDiv);
    }
}

function updateSeatDisplay() {
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => {
        const seatId = seat.getAttribute('data-seat-id');
        const asiento = cine.salas[cine.currentHall].asientos[seatId];
        
        if (asiento) {
            // Limpiar todas las clases
            seat.classList.remove('selected', 'available', 'occupied', 'user-occupied');
            
            if (!asiento.disponible) {
                if (asiento.reservadoPor === 'Usuario') {
                    seat.classList.add('user-occupied');
                    seat.setAttribute('title', `Asiento ${asiento.displayId} - Tu reserva (clic para cancelar)`);
                } else {
                    seat.classList.add('occupied');
                    seat.setAttribute('title', `Asiento ${asiento.displayId} - Ocupado`);
                }
            } else if (cine.selectedSeats.includes(seatId)) {
                seat.classList.add('selected');
                seat.setAttribute('title', `Asiento ${asiento.displayId} - Seleccionado`);
            } else {
                seat.classList.add('available');
                seat.setAttribute('title', `Asiento ${asiento.displayId} - Disponible`);
            }
        }
    });
}

function updateSummary() {
    const count = cine.selectedSeats.length;
    const sala = cine.salas[cine.currentHall];
    const total = count * sala.precio;
    
    document.getElementById('selectedSeatsCount').textContent = count;
    document.getElementById('totalPrice').textContent = `$${total.toLocaleString()}`;
    
    const seatsList = document.getElementById('selectedSeatsList');
    if (count === 0) {
        seatsList.innerHTML = '<p class="text-muted small">No hay asientos seleccionados</p>';
        document.getElementById('confirmBtn').disabled = true;
    } else {
        const tags = cine.selectedSeats.map(seatId => {
            const asiento = sala.asientos[seatId];
            return `<span class="seat-tag">${asiento.displayId}</span>`;
        }).join('');
        
        seatsList.innerHTML = tags;
        document.getElementById('confirmBtn').disabled = false;
    }
}

function clearSelection() {
    cine.selectedSeats = [];
    cine.saveToStorage();
    updateSeatDisplay();
    updateSummary();
}

function confirmReservation() {
    const reserved = cine.confirmarReserva();
    if (reserved.length > 0) {
        const seatNames = reserved.map(seatId => {
            const asiento = cine.salas[cine.currentHall].asientos[seatId];
            return asiento.displayId;
        }).join(', ');
        
        alert(`¡Reserva confirmada!\n\nSala: ${cine.salas[cine.currentHall].nombre}\nAsientos: ${seatNames}\nTotal: $${(reserved.length * cine.salas[cine.currentHall].precio).toLocaleString()}`);
        
        generateSeatsMap(cine.currentHall);
        updateSummary();
    }
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    cine.generarAsientos();
    
    // Mostrar la pantalla correcta según el estado guardado
    if (cine.currentHall) {
        showSeatSelection(cine.currentHall);
    } else {
        showWelcome();
    }
});