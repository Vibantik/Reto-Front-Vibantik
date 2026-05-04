import { useMemo } from "react";
import {
  Legend,
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TooltipContent({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item) {
    return null;
  }

  return (
    <div className="cashflow-tooltip">
      <p>Dia {item.label}</p>
      <strong>Ingresos: {formatMoney(item.ingreso)}</strong>
      <strong>Egresos: {formatMoney(item.egreso)}</strong>
      <strong>Ingreso acumulado: {formatMoney(item.ingresoAcumulado)}</strong>
      <strong>Egreso acumulado: {formatMoney(item.egresoAcumulado)}</strong>
    </div>
  );
}

export default function CashflowChart({ transactions }) {
  const { totalIncome, totalExpense, chartData, monthLabel } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayMap = new Map();
    for (let day = 1; day <= daysInMonth; day += 1) {
      dayMap.set(day, {
        day,
        label: String(day).padStart(2, "0"),
        ingreso: 0,
        egreso: 0,
      });
    }

    transactions.forEach((transaction) => {
      if (!transaction.date) return;

    const txDate = new Date(transaction.date.slice(0, 10) + "T12:00:00");
      if (Number.isNaN(txDate.getTime())) return;
      if (txDate.getMonth() !== month || txDate.getFullYear() !== year) return;

      const day = txDate.getDate();
      const entry = dayMap.get(day);
      if (!entry) return;

      if (transaction.type === "ingreso") {
        entry.ingreso += Number(transaction.amount || 0);
      } else {
        entry.egreso += Number(transaction.amount || 0);
      }
    });

    const dailyData = Array.from(dayMap.values());
    const income = dailyData.reduce((acc, item) => acc + item.ingreso, 0);
    const expense = dailyData.reduce((acc, item) => acc + item.egreso, 0);

    let runningIncome = 0;
    let runningExpense = 0;

    const cumulativeData = dailyData.map((item) => {
      runningIncome += item.ingreso;
      runningExpense += item.egreso;

      return {
        ...item,
        ingresoAcumulado: runningIncome,
        egresoAcumulado: runningExpense,
      };
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      chartData: cumulativeData,
      monthLabel: now.toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  return (
    <section className="cashflow-card" data-cy="cashflow-card" aria-label="Grafica de ingresos y egresos">
      <div className="cashflow-card__header">
        <div>
          <p className="cashflow-kicker">Visual de flujo</p>
          <h3>Flujo acumulado mensual</h3>
        </div>
        <div className={`cashflow-balance ${balance >= 0 ? "positive" : "negative"}`}>
          <Wallet size={16} />
          <span>Balance: {formatMoney(balance)}</span>
        </div>
      </div>

      <div className="cashflow-card__metrics">
        <div className="cashflow-metric income">
          <ArrowDownLeft size={16} />
          <div>
            <p>Ingresos</p>
            <strong>{formatMoney(totalIncome)}</strong>
          </div>
        </div>

        <div className="cashflow-metric expense">
          <ArrowUpRight size={16} />
          <div>
            <p>Egresos</p>
            <strong>{formatMoney(totalExpense)}</strong>
          </div>
        </div>
      </div>

      <div className="cashflow-chart-wrap" data-cy="cashflow-chart-wrap">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 10, bottom: 4, left: 10 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(91, 102, 112, 0.2)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5b6670", fontSize: 12 }}
              interval={2}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b868c", fontSize: 12 }}
              tickFormatter={(value) => `$${Number(value).toLocaleString("es-MX")}`}
            />
            <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(91, 102, 112, 0.08)" }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }}
            />
            <Line
              type="monotone"
              dataKey="ingresoAcumulado"
              name="Ingresos acumulados"
              stroke="#6cc04a"
              strokeWidth={3}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="egresoAcumulado"
              name="Egresos acumulados"
              stroke="#eb0029"
              strokeWidth={3}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="cashflow-footnote">
        Flujo acumulado de {monthLabel}. Si un dia no hay movimientos, la linea se mantiene sin regresar a cero.
      </p>
    </section>
  );
}
