import numpy as np
from flask_cors import CORS
from flask import Flask, request, jsonify

app = Flask(__name__)
CORS(app)

# --- 1. Definisi Model Pertumbuhan Populasi ---
def model_pertumbuhan(P, t, r, K):
    """
    Mendefinisikan persamaan diferensial untuk model pertumbuhan logistik.
    dP/dt = rP(1 - P/K)
    """
    return r * P * (1 - P / K)

# --- 2. Implementasi Metode Numerik Single-Step ---

def euler_method(P0, t0, tf, dt, r, K):
    times = np.arange(t0, tf + dt, dt)
    populations = np.zeros(len(times))
    populations[0] = P0
    for i in range(len(times) - 1):
        dPdt = model_pertumbuhan(populations[i], times[i], r, K)
        populations[i+1] = populations[i] + dt * dPdt
    return times.tolist(), populations.tolist()

def runge_kutta_2(P0, t0, tf, dt, r, K):
    times = np.arange(t0, tf + dt, dt)
    populations = np.zeros(len(times))
    populations[0] = P0
    for i in range(len(times) - 1):
        k1 = dt * model_pertumbuhan(populations[i], times[i], r, K)
        k2 = dt * model_pertumbuhan(populations[i] + k1/2, times[i] + dt/2, r, K)
        populations[i+1] = populations[i] + k2
    return times.tolist(), populations.tolist()

def runge_kutta_4(P0, t0, tf, dt, r, K):
    times = np.arange(t0, tf + dt, dt)
    populations = np.zeros(len(times))
    populations[0] = P0
    for i in range(len(times) - 1):
        k1 = dt * model_pertumbuhan(populations[i], times[i], r, K)
        k2 = dt * model_pertumbuhan(populations[i] + k1/2, times[i] + dt/2, r, K)
        k3 = dt * model_pertumbuhan(populations[i] + k2/2, times[i] + dt/2, r, K)
        k4 = dt * model_pertumbuhan(populations[i] + k3, times[i] + dt, r, K)
        populations[i+1] = populations[i] + (k1 + 2*k2 + 2*k3 + k4)/6
    return times.tolist(), populations.tolist()

# --- 3. API Endpoint ---
@app.route('/predict_population', methods=['POST']) # Menentukan metode POST
def predict_population():
    data = request.get_json() # Mendapatkan data JSON dari body permintaan

    # Validasi input
    required_params = ['P0_initial', 't_start', 't_end', 'delta_t', 'r_growth', 'K_carrying_capacity']
    for param in required_params:
        if param not in data:
            return jsonify({"error": f"Missing parameter: {param}"}), 400

    try:
        P0_initial = float(data['P0_initial'])
        t_start = float(data['t_start'])
        t_end = float(data['t_end'])
        delta_t = float(data['delta_t'])
        r_growth = float(data['r_growth'])
        K_carrying_capacity = float(data['K_carrying_capacity'])
    except ValueError:
        return jsonify({"error": "Invalid parameter type. All parameters must be numbers."}), 400

    # Jalankan simulasi
    times_euler, pop_euler = euler_method(P0_initial, t_start, t_end, delta_t, r_growth, K_carrying_capacity)
    times_rk2, pop_rk2 = runge_kutta_2(P0_initial, t_start, t_end, delta_t, r_growth, K_carrying_capacity)
    times_rk4, pop_rk4 = runge_kutta_4(P0_initial, t_start, t_end, delta_t, r_growth, K_carrying_capacity)

    # Siapkan respons JSON
    response = {
        "euler_method": {
            "times": times_euler,
            "populations": pop_euler
        },
        "runge_kutta_2": {
            "times": times_rk2,
            "populations": pop_rk2
        },
        "runge_kutta_4": {
            "times": times_rk4,
            "populations": pop_rk4
        }
    }
    return jsonify(response)

# --- 4. Jalankan Aplikasi Flask ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)