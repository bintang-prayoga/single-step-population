import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { useState } from "preact/hooks";
import axios from "axios";
import * as XLSX from "xlsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function App() {
  const [form, setForm] = useState({
    P0_initial: 100,
    t_start: 0,
    t_end: 100,
    delta_t: 0.5,
    r_growth: 0.1,
    K_carrying_capacity: 1000,
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("euler");

  const handleExport = () => {
    if (!chartData || !chartData.allData) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const exportData = chartData.allData[selectedMethod].data.map(
      (value, index) => ({
        time: chartData.labels[index],
        population: value,
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Population Data");

    const fileName = `population_data_${selectedMethod}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
    if (chartData && chartData.allData) {
      setChartData({
        ...chartData,
        datasets: [chartData.allData[e.target.value]],
      });
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.post(apiUrl, form, {
        headers: { "Content-Type": "application/json" },
      });
      const data = res.data;
      const allData = {
        euler: {
          label: "Euler",
          data: data.euler_method.populations,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        rk2: {
          label: "RK2",
          data: data.runge_kutta_2.populations,
          backgroundColor: "rgba(255, 206, 86, 0.5)",
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 1,
        },
        rk4: {
          label: "RK4",
          data: data.runge_kutta_4.populations,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      };
      setChartData({
        labels: data.euler_method.times,
        datasets: [allData[selectedMethod]],
        allData,
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Gagal menghubungi server atau permintaan tidak valid."
      );
      console.error("Error during simulation:", err);
    }
    setLoading(false);
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      <div className="flex items-center justify-center my-2 text-white">
        <h1 className="text-4xl font-bold">Prediksi Pertumbuhan Populasi</h1>
      </div>
      <div className="flex items-center justify-center my-1">
        <p className="bg-black text-white p-2 rounded-lg shadow-lg text-sm">
          Prediksi pertumbuhan populasi menggunakan metode single-step euler,
          Runge Kutta order 2 dan 4.
        </p>
      </div>

      <div className="flex items-center justify-center mt-8">
        <form
          className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg space-y-4"
          onSubmit={handleSimulate}
        >
          <div>
            <label
              htmlFor="P0_initial"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Populasi Awal (P0_initial)
            </label>
            <input
              type="number"
              step="any" // allows decimals
              id="P0_initial"
              name="P0_initial"
              value={form.P0_initial}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="t_start"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Waktu Awal Simulasi (t_start)
            </label>
            <input
              type="number"
              step="any" // allows decimals
              id="t_start"
              name="t_start"
              value={form.t_start}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label
              htmlFor="t_end"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Waktu Akhir Simulasi (t_end)
            </label>
            <input
              type="number"
              step="any"
              id="t_end"
              name="t_end"
              value={form.t_end}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="delta_t"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Ukuran Langkah Waktu (delta_t)
            </label>
            <input
              type="number"
              step="any"
              id="delta_t"
              name="delta_t"
              value={form.delta_t}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="0.5"
              required
            />
          </div>
          <div>
            <label
              htmlFor="r_growth"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Laju Pertumbuhan (r_growth)
            </label>
            <input
              type="number"
              step="any"
              id="r_growth"
              name="r_growth"
              value={form.r_growth}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="0.1"
              required
            />
          </div>
          <div>
            <label
              htmlFor="K_carrying_capacity"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Kapasitas Tampung (K_carrying_capacity)
            </label>
            <input
              type="number"
              step="any"
              id="K_carrying_capacity"
              name="K_carrying_capacity"
              value={form.K_carrying_capacity}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="1000"
              required
            />
          </div>

          <div className="flex items-center justify-center mt-4">
            <button
              type="submit"
              className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Simulasikan"}
            </button>
          </div>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </form>
        <div className=" w-1/2 h-full p-4 ml-10">
          <div className="flex justify-between mb-5">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hasil Simulasi
            </h1>
            <div className="flex items-center">
              <div>
                <label
                  htmlFor="method"
                  className="block -mt-7 mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Metode Simulasi
                </label>
                <select
                  id="method"
                  name="method"
                  value={selectedMethod}
                  onChange={handleMethodChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                  disabled={!chartData}
                >
                  <option value="euler">Single-step Euler</option>
                  <option value="rk2">Runge Kutta Orde 2</option>
                  <option value="rk4">Runge Kutta Orde 4</option>
                </select>
              </div>
              <button
                onClick={() => handleExport()}
                disabled={!chartData || !chartData.allData}
                className="cursor-pointer ml-4 px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Export to xlsx
              </button>
            </div>
          </div>
          {chartData ? (
            <Bar
              data={chartData}
              options={{
                ...options,
                plugins: {
                  legend: {
                    labels: {
                      color: "#fff", // Set legend text color to white
                    },
                  },
                },
              }}
            />
          ) : (
            <Bar
              data={{
                labels: ["0", "10", "20", "30", "40", "50"],
                datasets: [
                  {
                    label: "Contoh Data",
                    data: [100, 200, 300, 400, 500, 600],
                    backgroundColor: "rgba(200,200,200,0.5)",
                    borderColor: "rgba(160,160,160,1)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                ...options,
                plugins: {
                  legend: {
                    labels: {
                      color: "#fff", // Set legend text color to white
                    },
                  },
                  title: { display: true, text: "Grafik Placeholder" },
                },
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
