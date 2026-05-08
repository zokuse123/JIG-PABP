import { useState, useCallback } from "react";
import { DUMMY_CARS } from "../data/dummy";
import { carApi } from "../utils/api";

/**
 * Hook untuk state & operasi armada mobil.
 */
export function useCars() {
  const [cars, setCars] = useState(DUMMY_CARS);
  const [loading, setLoading] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await carApi.getAll();
      setCars(data);
    } catch {
      setCars(DUMMY_CARS);
    } finally {
      setLoading(false);
    }
  }, []);

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
