"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Soup,
  Sun,
  Utensils,
  Users,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Guest profile", href: "/dashboard/guests", Icon: Users },
  { label: "My bookings", href: "/dashboard/bookings", Icon: CalendarDays },
  { label: "Menus", href: "/dashboard/menu", Icon: Utensils },
];

const mealTypes = [
  { label: "Breakfast", count: 8, percent: 80, Icon: Coffee, tone: "blue" },
  { label: "Lunch", count: 6, percent: 60, Icon: Soup, tone: "green" },
  { label: "Dinner", count: 4, percent: 40, Icon: Utensils, tone: "gold" },
];

const mealOptions = ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"];

type GuestDateForm = {
  guestCount: string;
  childCount: string;
  driverCount: string;
  guideCount: string;
};

const initialGuestDateForm: GuestDateForm = {
  guestCount: "1",
  childCount: "0",
  driverCount: "",
  guideCount: "",
};

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

type CatalogFood = {
  id: string;
  name: string;
};

type CatalogIngredient = {
  id: string;
  name: string;
};

type HotelBranch = {
  id: string;
  name: string;
  location: string;
};

type FoodSearchCategory = "food" | "dessert";

type SavedBooking = {
  id: string;
  date: string;
  hotel: HotelBranch;
  guestCount: number;
  childrenCount: number;
  driverCount: number;
  guideCount: number;
  meals: Array<{
    type: string;
    name?: string;
    time: string;
    foods: CatalogFood[];
    desserts: CatalogFood[];
    hasIngredients: boolean;
    ingredients: CatalogIngredient[];
  }>;
  isVegetarian: boolean;
  hasAllergies: boolean;
  allergyCount: number;
  notes: string;
};

export default function GuestDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerStep, setPlannerStep] = useState<"guest-details" | "meals" | "foods" | "complete">("guest-details");
  const [branchHotels, setBranchHotels] = useState<HotelBranch[]>([]);
  const [hotelsLoaded, setHotelsLoaded] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [guestDateForm, setGuestDateForm] = useState(initialGuestDateForm);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [selectedMealTimes, setSelectedMealTimes] = useState<Record<string, string>>({});
  const [otherMealName, setOtherMealName] = useState("");
  const [plannerError, setPlannerError] = useState("");
  const [foodQueries, setFoodQueries] = useState<Record<string, string>>({});
  const [activeFoodSearchMeal, setActiveFoodSearchMeal] = useState<string | null>(null);
  const [foodResults, setFoodResults] = useState<Record<string, CatalogFood[]>>({});
  const [foodSearchLoading, setFoodSearchLoading] = useState<Record<string, boolean>>({});
  const [foodSearchErrors, setFoodSearchErrors] = useState<Record<string, string>>({});
  const [foodsByMeal, setFoodsByMeal] = useState<Record<string, CatalogFood[]>>({});
  const [dessertsByMeal, setDessertsByMeal] = useState<Record<string, CatalogFood[]>>({});
  const [addingFoodForMeal, setAddingFoodForMeal] = useState<string | null>(null);
  const [isVegetarian, setIsVegetarian] = useState<boolean | null>(null);
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [allergyCount, setAllergyCount] = useState("1");
  const [hasIngredientsByMeal, setHasIngredientsByMeal] = useState<Record<string, boolean | null>>({});
  const [ingredientQueries, setIngredientQueries] = useState<Record<string, string>>({});
  const [ingredientResults, setIngredientResults] = useState<Record<string, CatalogIngredient[]>>({});
  const [ingredientsByMeal, setIngredientsByMeal] = useState<Record<string, CatalogIngredient[]>>({});
  const [activeIngredientSearchMeal, setActiveIngredientSearchMeal] = useState<string | null>(null);
  const [ingredientSearchLoading, setIngredientSearchLoading] = useState<Record<string, boolean>>({});
  const [ingredientSearchErrors, setIngredientSearchErrors] = useState<Record<string, string>>({});
  const [addingIngredientForMeal, setAddingIngredientForMeal] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [savedBooking, setSavedBooking] = useState<SavedBooking | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
        });

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const result: { user?: AuthenticatedUser; error?: string } = await response.json();
        if (!response.ok || !result.user) {
          throw new Error(result.error || "Unable to load your account.");
        }

        if (active) {
          setUser(result.user);
        }
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Unable to load your account.");
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;

    async function loadHotels() {
      try {
        const response = await fetch(`${API_BASE_URL}/hotels`, { credentials: "include" });
        const result: { hotels?: HotelBranch[]; error?: string } = await response.json();
        if (response.status === 401) {
          router.replace("/");
          return;
        }
        if (!response.ok || !result.hotels) {
          throw new Error(result.error || "Unable to load hotel branches.");
        }
        if (active) {
          setBranchHotels(result.hotels);
          setSelectedHotelId(result.hotels[0]?.id || "");
        }
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : "Unable to load hotel branches.");
      } finally {
        if (active) setHotelsLoaded(true);
      }
    }

    if (!authLoading) void loadHotels();
    return () => {
      active = false;
    };
  }, [authLoading, router]);

  useEffect(() => {
    if (authLoading || !hotelsLoaded || editingBookingId) return;
    const bookingId = new URLSearchParams(window.location.search).get("editBooking");
    if (!bookingId) return;
    const requestedBookingId = bookingId;

    let active = true;
    async function loadBookingForEdit() {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(requestedBookingId)}`, {
          credentials: "include",
        });
        const result: { booking?: SavedBooking; error?: string } = await response.json();
        if (response.status === 401) {
          router.replace("/");
          return;
        }
        if (!response.ok || !result.booking) {
          throw new Error(result.error || "Unable to load this booking for editing.");
        }
        const booking = result.booking;
        if (!active) return;
        setEditingBookingId(booking.id);
        setSelectedDate(new Date(`${booking.date}T00:00:00`));
        setVisibleMonth(new Date(`${booking.date}T00:00:00`));
        setSelectedHotelId(booking.hotel.id);
        setGuestDateForm({
          guestCount: String(booking.guestCount),
          childCount: String(booking.childrenCount),
          driverCount: String(booking.driverCount),
          guideCount: String(booking.guideCount),
        });
        setSelectedMeals(booking.meals.map((meal) => meal.type));
        setSelectedMealTimes(Object.fromEntries(booking.meals.map((meal) => [meal.type, meal.time])));
        setOtherMealName(booking.meals.find((meal) => meal.type === "Other")?.name || "");
        setFoodsByMeal(Object.fromEntries(booking.meals.map((meal) => [meal.type, meal.foods])));
        setDessertsByMeal(Object.fromEntries(booking.meals.map((meal) => [meal.type, meal.desserts])));
        setHasIngredientsByMeal(Object.fromEntries(booking.meals.map((meal) => [meal.type, meal.hasIngredients])));
        setIngredientsByMeal(Object.fromEntries(booking.meals.map((meal) => [meal.type, meal.ingredients])));
        setIsVegetarian(booking.isVegetarian);
        setHasAllergies(booking.hasAllergies);
        setAllergyCount(String(booking.allergyCount || 1));
        setBookingNotes(booking.notes || "");
        setSavedBooking(null);
        setPlannerError("");
        setPlannerStep("guest-details");
        setPlannerOpen(true);
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : "Unable to load this booking for editing.");
      }
    }

    void loadBookingForEdit();
    return () => {
      active = false;
    };
  }, [authLoading, editingBookingId, hotelsLoaded, router]);

  useEffect(() => {
    if (plannerStep !== "foods" || !plannerOpen || !activeFoodSearchMeal) return;

    let active = true;
    const meal = activeFoodSearchMeal;
    const query = foodQueries[meal] || "";
    const timer = setTimeout(async () => {
      setFoodSearchLoading((current) => ({ ...current, [meal]: true }));
      setFoodSearchErrors((current) => ({ ...current, [meal]: "" }));

      try {
        const response = await fetch(
          `${API_BASE_URL}/foods?search=${encodeURIComponent(query.trim())}`,
          { credentials: "include" },
        );
        const result: { foods?: CatalogFood[]; error?: string } = await response.json();

        if (response.status === 401) {
          router.replace("/");
          return;
        }
        if (!response.ok || !result.foods) {
          throw new Error(result.error || "Unable to search foods.");
        }

        if (active) {
          setFoodResults((current) => ({ ...current, [meal]: result.foods || [] }));
        }
      } catch (error) {
        if (active) {
          setFoodSearchErrors((current) => ({
            ...current,
            [meal]: error instanceof Error ? error.message : "Unable to search foods.",
          }));
        }
      } finally {
        if (active) {
          setFoodSearchLoading((current) => ({ ...current, [meal]: false }));
        }
      }
    }, query.trim() ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeFoodSearchMeal, foodQueries, plannerOpen, plannerStep, router]);

  useEffect(() => {
    const meal = activeIngredientSearchMeal;
    if (
      plannerStep !== "foods" ||
      !plannerOpen ||
      !meal ||
      hasIngredientsByMeal[meal] !== true
    ) {
      return;
    }

    let active = true;
    const query = ingredientQueries[meal] || "";
    const timer = setTimeout(async () => {
      setIngredientSearchLoading((current) => ({ ...current, [meal]: true }));
      setIngredientSearchErrors((current) => ({ ...current, [meal]: "" }));

      try {
        const response = await fetch(
          `${API_BASE_URL}/ingredients?search=${encodeURIComponent(query.trim())}`,
          { credentials: "include" },
        );
        const result: { ingredients?: CatalogIngredient[]; error?: string } = await response.json();

        if (response.status === 401) {
          router.replace("/");
          return;
        }
        if (!response.ok || !result.ingredients) {
          throw new Error(result.error || "Unable to search ingredients.");
        }
        if (active) {
          setIngredientResults((current) => ({ ...current, [meal]: result.ingredients || [] }));
        }
      } catch (error) {
        if (active) {
          setIngredientSearchErrors((current) => ({
            ...current,
            [meal]: error instanceof Error ? error.message : "Unable to search ingredients.",
          }));
        }
      } finally {
        if (active) setIngredientSearchLoading((current) => ({ ...current, [meal]: false }));
      }
    }, query.trim() ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeIngredientSearchMeal, hasIngredientsByMeal, ingredientQueries, plannerOpen, plannerStep, router]);

  async function handleSignOut() {
    setSigningOut(true);
    setAuthError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sign out.");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  function openPlannerForDate(date: Date) {
    setEditingBookingId(null);
    setSelectedHotelId(branchHotels[0]?.id || "");
    setSelectedDate(date);
    setGuestDateForm(initialGuestDateForm);
    setSelectedMeals([]);
    setSelectedMealTimes({});
    setOtherMealName("");
    setFoodQueries({});
    setActiveFoodSearchMeal(null);
    setFoodResults({});
    setFoodSearchLoading({});
    setFoodSearchErrors({});
    setFoodsByMeal({});
    setDessertsByMeal({});
    setAddingFoodForMeal(null);
    setIsVegetarian(null);
    setHasAllergies(null);
    setAllergyCount("1");
    setHasIngredientsByMeal({});
    setIngredientQueries({});
    setIngredientResults({});
    setIngredientsByMeal({});
    setActiveIngredientSearchMeal(null);
    setIngredientSearchLoading({});
    setIngredientSearchErrors({});
    setAddingIngredientForMeal(null);
    setBookingNotes("");
    setBookingSubmitting(false);
    setSavedBooking(null);
    setPlannerError("");
    setPlannerStep("guest-details");
    setPlannerOpen(true);
  }

  function handleGuestDetailsNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlannerError("");

    if (!selectedHotelId) {
      setPlannerError("Choose a hotel branch for this booking.");
      return;
    }
    if (Number(guestDateForm.childCount) > Number(guestDateForm.guestCount)) {
      setPlannerError("Children cannot be more than the total number of guests.");
      return;
    }

    setPlannerStep("meals");
  }

  function toggleMealOption(option: string) {
    const removing = selectedMeals.includes(option);
    setSelectedMeals((current) =>
      removing
        ? current.filter((meal) => meal !== option)
        : [...current, option],
    );
    setPlannerError("");
    if (removing) {
      setSelectedMealTimes((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setFoodsByMeal((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setDessertsByMeal((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setFoodQueries((current) => {
        const next = { ...current };
        delete next[option];
        delete next[`dessert:${option}`];
        return next;
      });
      setFoodResults((current) => {
        const next = { ...current };
        delete next[option];
        delete next[`dessert:${option}`];
        return next;
      });
      setFoodSearchLoading((current) => {
        const next = { ...current };
        delete next[option];
        delete next[`dessert:${option}`];
        return next;
      });
      setFoodSearchErrors((current) => {
        const next = { ...current };
        delete next[option];
        delete next[`dessert:${option}`];
        return next;
      });
      setHasIngredientsByMeal((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setIngredientQueries((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setIngredientResults((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setIngredientsByMeal((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setIngredientSearchLoading((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      setIngredientSearchErrors((current) => {
        const next = { ...current };
        delete next[option];
        return next;
      });
      if (activeIngredientSearchMeal === option) setActiveIngredientSearchMeal(null);
      if (activeFoodSearchMeal === option || activeFoodSearchMeal === `dessert:${option}`) {
        setActiveFoodSearchMeal(null);
      }
    }
    if (option === "Other" && removing) {
      setOtherMealName("");
    }
  }

  function selectFoodForMeal(meal: string, food: CatalogFood, category: FoodSearchCategory = "food") {
    const searchKey = category === "dessert" ? `dessert:${meal}` : meal;
    const selectedFoods = foodsByMeal[meal] || [];
    const selectedDesserts = dessertsByMeal[meal] || [];
    if ([...selectedFoods, ...selectedDesserts].some((selected) => selected.id === food.id)) return;
    if (selectedFoods.length + selectedDesserts.length >= 20) {
      setFoodSearchErrors((current) => ({ ...current, [searchKey]: "Choose no more than 20 foods and desserts for one meal." }));
      return;
    }

    const setSelection = category === "dessert" ? setDessertsByMeal : setFoodsByMeal;
    setSelection((current) => {
      const latestFoods = current[meal] || [];
      if (latestFoods.some((selected) => selected.id === food.id)) return current;
      return { ...current, [meal]: [...latestFoods, food] };
    });
    setActiveFoodSearchMeal(null);
    setFoodQueries((current) => ({ ...current, [searchKey]: "" }));
    setFoodSearchErrors((current) => ({ ...current, [searchKey]: "" }));
  }

  async function addNewFoodForMeal(meal: string, category: FoodSearchCategory = "food") {
    const searchKey = category === "dessert" ? `dessert:${meal}` : meal;
    const name = (foodQueries[searchKey] || "").trim();
    if (!name) return;
    if ((foodsByMeal[meal] || []).length + (dessertsByMeal[meal] || []).length >= 20) {
      setFoodSearchErrors((current) => ({ ...current, [searchKey]: "Choose no more than 20 foods and desserts for one meal." }));
      return;
    }

    setAddingFoodForMeal(searchKey);
    setFoodSearchErrors((current) => ({ ...current, [searchKey]: "" }));

    try {
      const response = await fetch(`${API_BASE_URL}/foods`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result: { food?: CatalogFood; error?: string } = await response.json();

      if (response.status === 401) {
        router.replace("/");
        return;
      }
      if (!response.ok || !result.food) {
        throw new Error(result.error || "Unable to add this food.");
      }

      selectFoodForMeal(meal, result.food, category);
    } catch (error) {
      setFoodSearchErrors((current) => ({
        ...current,
        [searchKey]: error instanceof Error ? error.message : "Unable to add this food.",
      }));
    } finally {
      setAddingFoodForMeal(null);
    }
  }

  function selectIngredient(meal: string, ingredient: CatalogIngredient) {
    const selected = ingredientsByMeal[meal] || [];
    if (selected.some((item) => item.id === ingredient.id)) return;
    if (selected.length >= 50) {
      setIngredientSearchErrors((current) => ({ ...current, [meal]: "Choose no more than 50 ingredients for one meal." }));
      return;
    }
    setIngredientsByMeal((current) => {
      const currentMealIngredients = current[meal] || [];
      return currentMealIngredients.some((item) => item.id === ingredient.id)
        ? current
        : { ...current, [meal]: [...currentMealIngredients, ingredient] };
    });
    setIngredientQueries((current) => ({ ...current, [meal]: "" }));
    setIngredientResults((current) => ({ ...current, [meal]: [] }));
    setIngredientSearchLoading((current) => ({ ...current, [meal]: false }));
    setActiveIngredientSearchMeal(null);
    setIngredientSearchErrors((current) => ({ ...current, [meal]: "" }));
  }

  async function addNewIngredient(meal: string) {
    const name = (ingredientQueries[meal] || "").trim();
    if (!name) return;
    if ((ingredientsByMeal[meal] || []).length >= 50) {
      setIngredientSearchErrors((current) => ({ ...current, [meal]: "Choose no more than 50 ingredients for one meal." }));
      return;
    }

    setAddingIngredientForMeal(meal);
    setIngredientSearchErrors((current) => ({ ...current, [meal]: "" }));
    try {
      const response = await fetch(`${API_BASE_URL}/ingredients`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result: { ingredient?: CatalogIngredient; error?: string } = await response.json();

      if (response.status === 401) {
        router.replace("/");
        return;
      }
      if (!response.ok || !result.ingredient) {
        throw new Error(result.error || "Unable to add this ingredient.");
      }
      selectIngredient(meal, result.ingredient);
    } catch (error) {
      setIngredientSearchErrors((current) => ({
        ...current,
        [meal]: error instanceof Error ? error.message : "Unable to add this ingredient.",
      }));
    } finally {
      setAddingIngredientForMeal(null);
    }
  }

  function renderIngredientSection(meal: string) {
    const hasIngredients = hasIngredientsByMeal[meal];
    const selected = ingredientsByMeal[meal] || [];
    const query = ingredientQueries[meal] || "";
    const results = ingredientResults[meal] || [];
    const exactMatch = results.some(
      (ingredient) => ingredient.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
    );
    const mealLabel = meal === "Other" ? otherMealName : meal;

    return (
      <>
        <fieldset className="planner-preference-fieldset planner-ingredients-choice">
          <legend>Are you bringing ingredients for {mealLabel}?</legend>
          <label>
            <input
              type="radio"
              name={`bringingIngredients-${meal}`}
              required
              disabled={addingIngredientForMeal === meal}
              checked={hasIngredients === true}
              onChange={() => {
                setHasIngredientsByMeal((current) => ({ ...current, [meal]: true }));
                setIngredientSearchErrors((current) => ({ ...current, [meal]: "" }));
              }}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name={`bringingIngredients-${meal}`}
              required
              disabled={addingIngredientForMeal === meal}
              checked={hasIngredients === false}
              onChange={() => {
                setHasIngredientsByMeal((current) => ({ ...current, [meal]: false }));
                setIngredientsByMeal((current) => ({ ...current, [meal]: [] }));
                setIngredientQueries((current) => ({ ...current, [meal]: "" }));
                setIngredientResults((current) => ({ ...current, [meal]: [] }));
                setIngredientSearchLoading((current) => ({ ...current, [meal]: false }));
                setIngredientSearchErrors((current) => ({ ...current, [meal]: "" }));
                if (activeIngredientSearchMeal === meal) setActiveIngredientSearchMeal(null);
              }}
            />
            No
          </label>
        </fieldset>

        {hasIngredients === true && (
          <section className="planner-ingredients-section" aria-label={`Ingredients for ${mealLabel}`}>
            <div className="planner-ingredients-heading">
              <b>Add ingredients for {mealLabel}</b>
              <p>Search the ingredient catalog or add a new ingredient.</p>
            </div>
            {selected.length > 0 && (
              <div className="planner-selected-foods">
                {selected.map((ingredient) => (
                  <span className="planner-food-chip" key={ingredient.id}>
                    {ingredient.name}
                    <button
                      type="button"
                      aria-label={`Remove ${ingredient.name} from ${mealLabel}`}
                      onClick={() => setIngredientsByMeal((current) => ({
                        ...current,
                        [meal]: (current[meal] || []).filter((item) => item.id !== ingredient.id),
                      }))}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <label className="planner-food-search">
              Search ingredients
              <input
                type="search"
                maxLength={100}
                value={query}
                onFocus={() => setActiveIngredientSearchMeal(meal)}
                onChange={(event) => {
                  setIngredientQueries((current) => ({ ...current, [meal]: event.target.value }));
                  setActiveIngredientSearchMeal(meal);
                  setIngredientResults((current) => ({ ...current, [meal]: [] }));
                  setIngredientSearchErrors((current) => ({ ...current, [meal]: "" }));
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (exactMatch) {
                    const exactIngredient = results.find(
                      (ingredient) => ingredient.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
                    );
                    if (exactIngredient) selectIngredient(meal, exactIngredient);
                  } else if (query.trim()) {
                    void addNewIngredient(meal);
                  }
                }}
                placeholder={`Search or add an ingredient for ${mealLabel.toLocaleLowerCase()}...`}
                aria-label={`Search ingredients for ${mealLabel}`}
              />
            </label>
            {ingredientSearchLoading[meal] && (
              <small className="planner-food-status">Searching ingredients...</small>
            )}
            {ingredientSearchErrors[meal] && (
              <p className="planner-form-error" role="alert">{ingredientSearchErrors[meal]}</p>
            )}
            {activeIngredientSearchMeal === meal &&
              !ingredientSearchLoading[meal] &&
              !ingredientSearchErrors[meal] &&
              results.length === 0 && (
                <small className="planner-food-status">
                  {query.trim()
                    ? "No matching ingredients yet. Add it to the catalog."
                    : "No ingredients in the catalog yet. Search for one to add it."}
                </small>
              )}
            {activeIngredientSearchMeal === meal &&
              !ingredientSearchLoading[meal] &&
              results.length > 0 && (
                <div className="planner-food-results" aria-label={`Available ingredients for ${mealLabel}`}>
                  {results.map((ingredient) => {
                    const alreadySelected = selected.some((item) => item.id === ingredient.id);
                    return (
                      <button
                        type="button"
                        key={ingredient.id}
                        disabled={alreadySelected}
                        onClick={() => selectIngredient(meal, ingredient)}
                      >
                        {ingredient.name}{alreadySelected ? " · Added" : ""}
                      </button>
                    );
                  })}
                </div>
              )}
            {activeIngredientSearchMeal === meal &&
              query.trim() &&
              !ingredientSearchLoading[meal] &&
              !ingredientSearchErrors[meal] &&
              !exactMatch && (
                <button
                  type="button"
                  className="planner-add-food"
                  disabled={addingIngredientForMeal === meal}
                  onClick={() => void addNewIngredient(meal)}
                >
                  {addingIngredientForMeal === meal
                    ? "Adding ingredient..."
                    : `Add "${query.trim()}" and select`}
                </button>
              )}
          </section>
        )}
      </>
    );
  }

  function handleMealSelectionNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlannerError("");

    if (selectedMeals.length === 0) {
      setPlannerError("Select at least one meal type to continue.");
      return;
    }

    if (selectedMeals.some((meal) => !selectedMealTimes[meal])) {
      setPlannerError("Select a time for each meal type.");
      return;
    }

    if (selectedMeals.includes("Other") && !otherMealName.trim()) {
      setPlannerError("Enter a name for the other meal or event.");
      return;
    }

    setFoodQueries(Object.fromEntries(selectedMeals.map((meal) => [meal, ""])));
    setPlannerStep("foods");
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlannerError("");

    if (selectedMeals.some((meal) => (foodsByMeal[meal] || []).length === 0)) {
      setPlannerError("Choose at least one food for every selected meal.");
      return;
    }
    if (isVegetarian === null || hasAllergies === null) {
      setPlannerError("Choose the vegetarian and allergy options.");
      return;
    }
    if (selectedMeals.some((meal) => hasIngredientsByMeal[meal] === undefined || hasIngredientsByMeal[meal] === null)) {
      setPlannerError("Choose whether you are bringing ingredients for each meal.");
      return;
    }
    if (selectedMeals.some((meal) => hasIngredientsByMeal[meal] && (ingredientsByMeal[meal] || []).length === 0)) {
      setPlannerError("Add at least one ingredient for each meal marked Yes.");
      return;
    }
    if (hasAllergies && (Number(allergyCount) < 1 || Number(allergyCount) > Number(guestDateForm.guestCount))) {
      setPlannerError("Enter an allergy count between one and the guest count.");
      return;
    }

    setBookingSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings${editingBookingId ? `/${encodeURIComponent(editingBookingId)}` : ""}`,
        {
        method: editingBookingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`,
          guestCount: Number(guestDateForm.guestCount),
          childrenCount: Number(guestDateForm.childCount),
          driverCount: Number(guestDateForm.driverCount || 0),
          guideCount: Number(guestDateForm.guideCount || 0),
          meals: selectedMeals.map((type) => ({
            type,
            ...(type === "Other" ? { name: otherMealName.trim() } : {}),
            time: selectedMealTimes[type],
            hasIngredients: hasIngredientsByMeal[type] === true,
            ingredientIds: (ingredientsByMeal[type] || []).map((ingredient) => ingredient.id),
            foodIds: (foodsByMeal[type] || []).map((food) => food.id),
            dessertIds: (dessertsByMeal[type] || []).map((food) => food.id),
          })),
          isVegetarian,
          hasAllergies,
          allergyCount: hasAllergies ? Number(allergyCount) : 0,
          notes: bookingNotes.trim(),
        }),
      });
      const result: { booking?: SavedBooking; error?: string } = await response.json();

      if (response.status === 401) {
        router.replace("/");
        return;
      }
      if (!response.ok || !result.booking) {
        throw new Error(result.error || "Unable to confirm this booking.");
      }

      setSavedBooking(result.booking);
      setPlannerStep("complete");
    } catch (error) {
      setPlannerError(error instanceof Error ? error.message : "Unable to confirm this booking.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  const userInitials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";
  const firstName = user?.name.trim().split(/\s+/)[0] || (authLoading ? "..." : "there");
  const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = new Date();
  const sameDate = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  function renderFoodSearch(meal: string, category: FoodSearchCategory) {
    const searchKey = category === "dessert" ? `dessert:${meal}` : meal;
    const query = foodQueries[searchKey] || "";
    const results = foodResults[searchKey] || [];
    const selectedFoods = [...(foodsByMeal[meal] || []), ...(dessertsByMeal[meal] || [])];
    const exactMatch = results.some(
      (food) => food.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
    );
    const label = category === "dessert" ? "Search desserts" : "Search foods";

    return (
      <>
        <label className="planner-food-search">
          {label}
          <input
            type="search"
            maxLength={100}
            value={query}
            onFocus={() => setActiveFoodSearchMeal(searchKey)}
            onChange={(event) => {
              setFoodSearchLoading((current) => ({ ...current, [searchKey]: true }));
              setFoodSearchErrors((current) => ({ ...current, [searchKey]: "" }));
              setFoodResults((current) => ({ ...current, [searchKey]: [] }));
              setFoodQueries((current) => ({ ...current, [searchKey]: event.target.value }));
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (exactMatch) {
                const exactFood = results.find(
                  (food) => food.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
                );
                if (exactFood) selectFoodForMeal(meal, exactFood, category);
              } else if (query.trim()) {
                void addNewFoodForMeal(meal, category);
              }
            }}
            placeholder={`Search or add ${category === "dessert" ? "a dessert" : "food"} for ${meal.toLocaleLowerCase()}...`}
            aria-label={`${label} for ${meal}`}
          />
        </label>
        {activeFoodSearchMeal === searchKey && foodSearchLoading[searchKey] && (
          <small className="planner-food-status">Searching {category === "dessert" ? "desserts" : "foods"}...</small>
        )}
        {activeFoodSearchMeal === searchKey && foodSearchErrors[searchKey] && (
          <p className="planner-form-error" role="alert">{foodSearchErrors[searchKey]}</p>
        )}
        {activeFoodSearchMeal === searchKey && !foodSearchLoading[searchKey] && !foodSearchErrors[searchKey] && results.length === 0 && (
          <small className="planner-food-status">
            {query.trim()
              ? `No matching ${category === "dessert" ? "desserts" : "foods"} yet. Add it to the shared catalog.`
              : `No ${category === "dessert" ? "desserts" : "foods"} in the catalog yet. Search for one to add it.`}
          </small>
        )}
        {activeFoodSearchMeal === searchKey && !foodSearchLoading[searchKey] && results.length > 0 && (
          <div className="planner-food-results" aria-label={`Available ${category === "dessert" ? "desserts" : "foods"} for ${meal}`}>
            {results.map((food) => {
              const alreadySelected = selectedFoods.some((selected) => selected.id === food.id);
              return (
                <button
                  type="button"
                  key={food.id}
                  disabled={alreadySelected}
                  onClick={() => selectFoodForMeal(meal, food, category)}
                >
                  {food.name}{alreadySelected ? " · Added" : ""}
                </button>
              );
            })}
          </div>
        )}
        {activeFoodSearchMeal === searchKey && query.trim() && !foodSearchLoading[searchKey] && !exactMatch && (
          <button
            type="button"
            className="planner-add-food"
            disabled={addingFoodForMeal === searchKey}
            onClick={() => void addNewFoodForMeal(meal, category)}
          >
            {addingFoodForMeal === searchKey
              ? `Adding ${category === "dessert" ? "dessert" : "food"}...`
              : `Add "${query.trim()}" and select`}
          </button>
        )}
      </>
    );
  }

  return (
    <main className="guest-dashboard" id="overview">
      {sidebarOpen && (
        <button
          className="dashboard-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`guest-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link className="dashboard-brand" href="/">
          <span className="dashboard-brand-icon" aria-hidden="true" />
          <span>Menu<span>Pilot</span><small>GUEST PORTAL</small></span>
        </Link>
        <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>

        <div className="guest-profile">
          <span className="guest-avatar">{userInitials}</span>
          <span>
            <b>{user?.name || (authLoading ? "Loading account..." : "Account unavailable")}</b>
            <small>{user?.email || (authLoading ? "Loading profile..." : "")}</small>
          </span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="dashboard-nav" aria-label="Guest dashboard">
          {navigation.map(({ label, href, Icon }) => (
            <Link
              key={label}
              className={pathname === href ? "active" : ""}
              aria-current={pathname === href ? "page" : undefined}
              href={href}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "My bookings" && <span className="nav-count">2</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><b>Need a hand?</b><small>Our team is here to help.</small></div>
            <a href="/#contact" aria-label="Contact support"><ArrowUpRight size={16} /></a>
          </div>
          <button
            className="sidebar-logout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={17} /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <button
              className="dashboard-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span><ChevronRight size={15} /><b>Guest dashboard</b>
          </div>
          <div className="dashboard-top-actions">
            <span className="dashboard-date">Friday, 27 November 2026</span>
            <button className="dashboard-bell" aria-label="Notifications">
              <Bell size={19} /><i />
            </button>
            <div className="dashboard-account">
              <span className="top-avatar">{userInitials}</span>
              <span className="dashboard-account-info">
                <b>{user?.name || (authLoading ? "Loading..." : "Account unavailable")}</b>
                <small>{user?.email || ""}</small>
              </span>
            </div>
            <button
              className="dashboard-logout"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={15} />
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {authError && <p className="dashboard-auth-error" role="alert">{authError}</p>}
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><i /> YOUR MENUPILOT SPACE</div>
              <h1>Good morning, {firstName} <Sun size={19} className="welcome-sun" /></h1>
              <p>Here’s what’s happening with your stays and menus.</p>
            </div>
            <Link className="dashboard-plan-link" href="#meal-planner">
              <Utensils size={17} /> Plan a meal <ArrowUpRight size={15} />
            </Link>
          </section>

          <section className="dashboard-stats" aria-label="Your dashboard statistics">
            <article className="dashboard-stat">
              <span className="stat-icon blue"><CalendarDays size={19} /></span>
              <div className="stat-label">Upcoming bookings</div>
              <div className="stat-value">02 <span className="stat-caption">this month</span></div>
              <div className="stat-foot"><span className="status-dot green-dot" /> 1 confirmed · 1 to review</div>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon green"><Utensils size={19} /></span>
              <div className="stat-label">Meals selected</div>
              <div className="stat-value">18 <span className="stat-caption">of 24</span></div>
              <div className="stat-progress"><i style={{ width: "75%" }} /></div>
              <div className="stat-foot">6 meal choices left to make</div>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon gold"><ClipboardList size={19} /></span>
              <div className="stat-label">Invitations</div>
              <div className="stat-value">04 <span className="stat-caption">received</span></div>
              <div className="stat-foot"><span className="status-dot gold-dot" /> 1 needs your response</div>
            </article>
            <article className="dashboard-stat">
              <span className="stat-icon violet"><Leaf size={19} /></span>
              <div className="stat-label">Food preferences</div>
              <div className="stat-value">03 <span className="stat-caption">saved</span></div>
              <div className="stat-foot"><Check size={14} className="tiny-check" /> Shared with your hosts</div>
            </article>
          </section>

          <section className="overview-planner-section" id="meal-planner">
            <div className="overview-planner-title">
              <div className="dashboard-eyebrow"><i /> MENUS & PREFERENCES</div>
              <h2>Meal planner</h2>
            </div>
            <section className="overview-calendar-section" aria-label="Meal planner calendar">
              <div className="overview-calendar-card">
                <div className="overview-calendar-heading">
                  <div>
                    <div className="dashboard-eyebrow"><i /> YOUR CALENDAR</div>
                    <h2>Select a date</h2>
                  </div>
                  <CalendarDays size={20} aria-hidden="true" />
                </div>
                <div className="overview-calendar-month">
                  <b>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(visibleMonth)}</b>
                  <div>
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
                <div className="overview-calendar-grid" role="group" aria-label="Choose a date">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <span className="overview-calendar-weekday" key={day}>{day}</span>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <span className="overview-calendar-empty" key={`empty-${index}`} aria-hidden="true" />;
                    }

                    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                    const isSelected = sameDate(date, selectedDate);
                    const isToday = sameDate(date, today);
                    return (
                      <button
                        className={`overview-calendar-day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                        key={day}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(date)}
                        onClick={() => openPlannerForDate(date)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="overview-calendar-selected">
                  Selected date <b>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(selectedDate)}</b>
                </p>
              </div>
            </section>
            <div className="section-page-grid overview-meal-content">
              <section className="section-page-card">
                <div className="section-page-card-heading">
                  <div><h2>Meal selections</h2><p>Review meals for your selected date.</p></div>
                  <span className="booking-total">18 of 24 selected</span>
                </div>
                <div className="meal-bars">
                  {mealTypes.map(({ label, count, percent, Icon, tone }) => (
                    <div className="meal-bar-row" key={label}>
                      <span className={`meal-type-icon ${tone}`}><Icon size={17} /></span>
                      <span className="meal-type-name">{label}</span>
                      <div className="meal-bar-track"><i className={tone} style={{ width: `${percent}%` }} /></div>
                      <b>{count}<small> meals</small></b>
                    </div>
                  ))}
                </div>
              </section>
              <section className="section-page-card section-preference-card">
                <span className="overview-preference-icon"><Leaf size={19} /></span>
                <div><h2>Your food preferences</h2><p>Vegetarian · Shared with your hosts</p></div>
                <span className="section-preference-check"><Check size={15} /> Saved</span>
              </section>
            </div>
          </section>

          <footer className="dashboard-footer"><span>© 2026 MenuPilot Guest Portal</span><span>Made for memorable moments <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>

      {plannerOpen && (
        <div
          className="planner-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !bookingSubmitting && !addingFoodForMeal) {
              setPlannerOpen(false);
            }
          }}
        >
          <aside className="planner-drawer" role="dialog" aria-modal="true" aria-labelledby="planner-drawer-title">
            <header className="planner-drawer-header">
              <div>
                <span className="planner-drawer-date">
                  {new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(selectedDate)}
                </span>
                <h2 id="planner-drawer-title">
                  {plannerStep === "complete" ? "Booking confirmed" : plannerStep === "foods" ? "Confirm your booking" : "Plan your day"}
                </h2>
              </div>
              <button type="button" className="planner-drawer-close" onClick={() => setPlannerOpen(false)} aria-label="Close meal planner" disabled={bookingSubmitting || addingFoodForMeal !== null}>
                <X size={19} />
              </button>
            </header>

            {plannerStep === "guest-details" && (
              <form className="planner-drawer-form" onSubmit={handleGuestDetailsNext}>
                <div className="planner-step-heading">
                  <span>STEP 1 OF 3</span>
                  <h3>Who is joining you?</h3>
                  <p>Tell us how many people will be there on this date.</p>
                </div>
                <label>
                  Hotel branch
                  <select required value={selectedHotelId} onChange={(event) => setSelectedHotelId(event.target.value)} disabled={!hotelsLoaded || branchHotels.length === 0}>
                    <option value="">{hotelsLoaded ? "Select a hotel branch" : "Loading hotel branches..."}</option>
                    {branchHotels.map((hotel) => <option value={hotel.id} key={hotel.id}>{hotel.name} · {hotel.location}</option>)}
                  </select>
                </label>
                <div className="planner-form-grid">
                  <label>
                    Number of guests
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      required
                      value={guestDateForm.guestCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, guestCount: event.target.value }))}
                    />
                  </label>
                  <label>
                    Children
                    <input
                      type="number"
                      min="0"
                      max={guestDateForm.guestCount}
                      step="1"
                      required
                      value={guestDateForm.childCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, childCount: event.target.value }))}
                    />
                  </label>
                  <label>
                    Drivers <span className="planner-optional">Optional</span>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      placeholder="Number of drivers"
                      value={guestDateForm.driverCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, driverCount: event.target.value }))}
                    />
                  </label>
                  <label>
                    Guides <span className="planner-optional">Optional</span>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      placeholder="Number of guides"
                      value={guestDateForm.guideCount}
                      onChange={(event) => setGuestDateForm((form) => ({ ...form, guideCount: event.target.value }))}
                    />
                  </label>
                </div>
                {plannerError && <p className="planner-form-error" role="alert">{plannerError}</p>}
                <div className="planner-drawer-actions">
                  <button type="button" className="planner-secondary-button" onClick={() => setPlannerOpen(false)} disabled={addingFoodForMeal !== null}>Cancel</button>
                  <button type="submit" className="planner-primary-button">Next <ChevronRight size={16} /></button>
                </div>
              </form>
            )}

            {plannerStep === "meals" && (
              <form className="planner-drawer-form" onSubmit={handleMealSelectionNext}>
                <div className="planner-step-heading">
                  <span>STEP 2 OF 3</span>
                  <h3>Which meals should we plan?</h3>
                  <p>Select the meal types you need for this date.</p>
                </div>
                <div className="planner-meal-options">
                  {mealOptions.map((option) => (
                    <div className={`planner-meal-option${selectedMeals.includes(option) ? " is-selected" : ""}`} key={option}>
                      <label className="planner-meal-choice">
                        <input
                          type="checkbox"
                          checked={selectedMeals.includes(option)}
                          onChange={() => toggleMealOption(option)}
                        />
                        <span>{option}</span>
                      </label>
                      {selectedMeals.includes(option) && (
                        <label className="planner-meal-time">
                          Time
                          <input
                            type="time"
                            required
                            value={selectedMealTimes[option] || ""}
                            onChange={(event) => {
                              setSelectedMealTimes((times) => ({ ...times, [option]: event.target.value }));
                              setPlannerError("");
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                {selectedMeals.includes("Other") && (
                  <label className="planner-other-meal">
                    Other meal or event name
                    <input
                      type="text"
                      maxLength={100}
                      autoFocus
                      required
                      value={otherMealName}
                      onChange={(event) => setOtherMealName(event.target.value)}
                      placeholder="e.g. Birthday dinner"
                    />
                  </label>
                )}
                {plannerError && <p className="planner-form-error" role="alert">{plannerError}</p>}
                <div className="planner-drawer-actions">
                  <button type="button" className="planner-secondary-button" onClick={() => setPlannerOpen(false)} disabled={addingFoodForMeal !== null}>Cancel</button>
                  <button type="button" className="planner-back-button" onClick={() => { setPlannerError(""); setPlannerStep("guest-details"); }}>Back</button>
                  <button type="submit" className="planner-primary-button">Next <ChevronRight size={16} /></button>
                </div>
              </form>
            )}

            {plannerStep === "foods" && (
              <form className="planner-drawer-form" onSubmit={handleBookingSubmit}>
                <div className="planner-step-heading">
                  <span>STEP 3 OF 3</span>
                  <h3>Choose foods and preferences</h3>
                  <p>Add foods for each selected meal, then confirm dietary details.</p>
                </div>

                <div className="planner-food-selections">
                  {selectedMeals.map((meal) => {
                    const selectedFoods = foodsByMeal[meal] || [];
                    const selectedDesserts = dessertsByMeal[meal] || [];

                    return (
                      <section className="planner-food-card" key={meal}>
                        <div className="planner-food-card-heading">
                          <h4>{meal === "Other" ? otherMealName : meal}</h4>
                          <span>{selectedMealTimes[meal]}</span>
                        </div>
                        {selectedFoods.length > 0 && (
                          <div className="planner-selected-foods">
                            {selectedFoods.map((food) => (
                              <span className="planner-food-chip" key={food.id}>
                                {food.name}
                                <button
                                  type="button"
                                  aria-label={`Remove ${food.name} from ${meal}`}
                                  onClick={() => setFoodsByMeal((current) => ({
                                    ...current,
                                    [meal]: (current[meal] || []).filter((selected) => selected.id !== food.id),
                                  }))}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {renderFoodSearch(meal, "food")}
                        {selectedDesserts.length > 0 && (
                          <div className="planner-selected-foods planner-selected-desserts">
                            <span className="planner-dessert-caption">Selected desserts</span>
                            {selectedDesserts.map((food) => (
                              <span className="planner-food-chip" key={food.id}>
                                {food.name}
                                <button
                                  type="button"
                                  aria-label={`Remove ${food.name} from ${meal} desserts`}
                                  onClick={() => setDessertsByMeal((current) => ({
                                    ...current,
                                    [meal]: (current[meal] || []).filter((selected) => selected.id !== food.id),
                                  }))}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="planner-dessert-heading">
                          <b>Desserts</b><span>Optional</span>
                        </div>
                        {renderFoodSearch(meal, "dessert")}
                        {renderIngredientSection(meal)}
                      </section>
                    );
                  })}
                </div>

                <fieldset className="planner-preference-fieldset">
                  <legend>Are any guests vegetarian?</legend>
                  <label><input type="radio" name="vegetarian" required checked={isVegetarian === true} onChange={() => setIsVegetarian(true)} /> Yes</label>
                  <label><input type="radio" name="vegetarian" required checked={isVegetarian === false} onChange={() => setIsVegetarian(false)} /> No</label>
                </fieldset>

                <fieldset className="planner-preference-fieldset">
                  <legend>Does anyone have food allergies?</legend>
                  <label><input type="radio" name="allergies" required checked={hasAllergies === true} onChange={() => setHasAllergies(true)} /> Yes</label>
                  <label><input type="radio" name="allergies" required checked={hasAllergies === false} onChange={() => setHasAllergies(false)} /> No</label>
                </fieldset>

                {hasAllergies && (
                  <label className="planner-allergy-count">
                    Number of guests with allergies
                    <input
                      type="number"
                      min="1"
                      max={guestDateForm.guestCount}
                      required
                      value={allergyCount}
                      onChange={(event) => setAllergyCount(event.target.value)}
                    />
                  </label>
                )}

                <label className="planner-booking-notes">
                  Notes <span className="planner-optional">Optional</span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={bookingNotes}
                    onChange={(event) => setBookingNotes(event.target.value)}
                    placeholder="Add any other meal requests or details."
                  />
                </label>

                {plannerError && <p className="planner-form-error" role="alert">{plannerError}</p>}
                <div className="planner-drawer-actions">
                  <button type="button" className="planner-secondary-button" onClick={() => setPlannerOpen(false)} disabled={bookingSubmitting || addingFoodForMeal !== null || addingIngredientForMeal !== null}>Cancel</button>
                  <button type="button" className="planner-back-button" onClick={() => { setPlannerError(""); setPlannerStep("meals"); }} disabled={bookingSubmitting || addingFoodForMeal !== null || addingIngredientForMeal !== null}>Back</button>
                  <button type="submit" className="planner-primary-button" disabled={bookingSubmitting || addingFoodForMeal !== null || addingIngredientForMeal !== null}>
                    {bookingSubmitting ? "Saving..." : editingBookingId ? "Save changes" : "Confirm booking"}
                  </button>
                </div>
              </form>
            )}

            {plannerStep === "complete" && (
              <div className="planner-complete">
                <span className="planner-complete-icon"><CheckCircle2 size={26} /></span>
                <h3>{editingBookingId ? "Your booking is updated" : "Your booking is saved"}</h3>
                <p>Selections for {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(selectedDate)}</p>
                <div className="planner-complete-summary">
                  <span><b>Guests</b>{guestDateForm.guestCount} total · {guestDateForm.childCount} children</span>
                  <span><b>Drivers</b>{guestDateForm.driverCount || "0"}</span>
                  <span><b>Guides</b>{guestDateForm.guideCount || "0"}</span>
                  <span><b>Meals</b>{selectedMeals.map((meal) => `${meal === "Other" ? otherMealName.trim() : meal} · ${selectedMealTimes[meal]}`).join(", ")}</span>
                  <span><b>Vegetarian guests</b>{isVegetarian ? "Yes" : "No"}</span>
                  <span><b>Allergies</b>{hasAllergies ? `${allergyCount} guest(s)` : "No"}</span>
                </div>
                {savedBooking && <p className="planner-booking-reference">Booking reference: {savedBooking.id}</p>}
                <Link className="planner-primary-button planner-done-button" href="/dashboard/bookings" onClick={() => setPlannerOpen(false)}>
                  View my bookings
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
