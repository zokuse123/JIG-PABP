import { useState, useCallback, useEffect } from "react";
import { carApi } from "../utils/api";

const getCarRows = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.cars)) return res.cars;
  return [];
};

const mapCarFromApi = (c) => ({
  id: c.id,
  name: c.name || c.nama_grup || "",
  nama_grup: c.nama_grup || c.name || "",
  type: c.type || c.plat_nomor || "-",
  plat_nomor: c.plat_nomor || c.type || "",
  year: c.year || "-",
  label: c.label || (c.is_external ? "external" : "internal"),
  is_external: Boolean(c.is_external),
  status: c.status || "available",
  driver: c.driver || "",
});

/**
 * Hook untuk state & operasi armada mobil.
 */
export function useCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await carApi.getAll();
      setCars(getCarRows(res).map(mapCarFromApi));
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const updateCar = useCallback(async (id, data) => {
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    try {
      await carApi.update(id, data);
    } catch {
      // silent
    }
  }, []);

  return { cars, setCars, loading, fetchCars, updateCar };
}
