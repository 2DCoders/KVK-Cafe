import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  Check,
  Clock,
  Utensils,
} from "lucide-react";
import { createPortal } from "react-dom";
import { createMenuItem, getMenuItems } from "@/services/cafe-menu-api";

type MenuTab = "coffee" | "meals";

const getBase64ImageSrc = (
  base64: string | null | undefined,
): string => {
  if (!base64) return "";

  // Already a complete data URI
  if (base64.startsWith("data:image/")) {
    return base64;
  }

  // Raw Base64 returned by API
  return `data:image/png;base64,${base64}`;
};

interface CoffeeItem {
  id: number;
  name: string;
  image?: string;
  price: number;
  description: string;
  facts: string;
  ingredients: string[];
}

interface MealItem {
  id: number;
  name: string;
  image?: string;
  price: number;
  description: string;
  facts: string;
  includes: string[];
  preparationTimeInMinutes: number;
  portion: string;
}

interface FormData {
  name: string;
  image: File | null;
  imagePreview: string;
  price: string;
  description: string;
  facts: string;

  ingredients: string[];

  includes: string[];
  preparationTimeInMinutes: string;
  portion: string;
}

const ingredientOptions = [
  "Coffee",
  "Espresso",
  "Milk",
  "Sugar",
  "Water",
  "Ice",
  "Chocolate",
  "Vanilla",
  "Caramel",
  "Whipped Cream",
  "Cinnamon",
  "Honey",
];

const emptyForm: FormData = {
  name: "",
  image: null,
  imagePreview: "",
  price: "",
  description: "",
  facts: "",

  ingredients: [],

  includes: [],
  preparationTimeInMinutes: "",
  portion: "",
};

type AlertState = {
  visible: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
};

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<MenuTab>("coffee");

  const [coffeeItems, setCoffeeItems] = useState<CoffeeItem[]>([]);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>(emptyForm);

  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);

  const [includeText, setIncludeText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<AlertState>({
    visible: false,
    variant: "success",
    title: "",
    description: "",
  });

  const filteredCoffeeItems = useMemo(() => {
    return coffeeItems.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [coffeeItems, search]);

  const filteredMealItems = useMemo(() => {
    return mealItems.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [mealItems, search]);

  const loadMenuItems = async (category: number) => {
    try {
      setIsLoading(true);

      const response = await getMenuItems(category);

      const data =
        response?.additionalData?.response ??
        response?.response ??
        response ??
        [];

      const mappedData = data.map((item: any) => ({
        ...item,
        ingredients:
          typeof item.ingredients === "string"
            ? item.ingredients
                .split(",")
                .map((x: string) => x.trim())
                .filter(Boolean)
            : (item.ingredients ?? []),
        includes:
          typeof item.includes === "string"
            ? item.includes
                .split(",")
                .map((x: string) => x.trim())
                .filter(Boolean)
            : (item.includes ?? []),
      }));

      if (category === 4) {
        setCoffeeItems(mappedData);
      } else if (category === 1) {
        setMealItems(mappedData);
      }
    } catch (error) {
      console.error("Failed to load menu items:", error);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Failed to Load Menu",
        description: "Unable to load menu items. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems(4);
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIncludeText("");
    setShowIngredientDropdown(false);
    setShowModal(true);
  };

const openEditModal = (item: CoffeeItem | MealItem) => {
  setEditingId(item.id);

  if (activeTab === "coffee") {
    const coffee = item as CoffeeItem;

    setFormData({
      name: coffee.name,
      image: null,
      imagePreview: getBase64ImageSrc(coffee.image),
      price: coffee.price.toString(),
      description: coffee.description,
      facts: coffee.facts,
      ingredients: coffee.ingredients,

      includes: [],
      preparationTimeInMinutes: "",
      portion: "",
    });
  } else {
    const meal = item as MealItem;

    setFormData({
      name: meal.name,
      image: null,
      imagePreview: getBase64ImageSrc(meal.image),
      price: meal.price.toString(),
      description: meal.description,
      facts: meal.facts,
      ingredients: [],

      includes: meal.includes,
      preparationTimeInMinutes:
        meal.preparationTimeInMinutes?.toString() || "",
      portion: meal.portion || "",
    });
  }

  setIncludeText("");
  setShowIngredientDropdown(false);
  setShowModal(true);
};

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
    setIncludeText("");
    setShowIngredientDropdown(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const toggleIngredient = (ingredient: string) => {
    setFormData((prev) => {
      const exists = prev.ingredients.includes(ingredient);

      return {
        ...prev,
        ingredients: exists
          ? prev.ingredients.filter((x) => x !== ingredient)
          : [...prev.ingredients, ingredient],
      };
    });
  };

  const addInclude = () => {
    const value = includeText.trim();

    if (!value) return;

    setFormData((prev) => ({
      ...prev,
      includes: [...prev.includes, value],
    }));

    setIncludeText("");
  };

  const removeInclude = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter item name.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (activeTab === "coffee") {
      const item: CoffeeItem = {
        id: editingId ?? Date.now(),
        name: formData.name,
        image: formData.imagePreview,
        price: Number(formData.price),
        description: formData.description,
        facts: formData.facts,
        ingredients: formData.ingredients,
      };

      const formDataToSend = new FormData();
      formDataToSend.append("name", item.name);
      formDataToSend.append("price", item.price.toString());
      formDataToSend.append("description", item.description);
      formDataToSend.append("facts", item.facts);
      formDataToSend.append("ingredients", item.ingredients.join(","));
      formDataToSend.append("image", formData.image || new Blob());
      formDataToSend.append("category", "4");
      formDataToSend.append("preparationTimeInMinutes", "0");
      formDataToSend.append("portionSize", "0");
      formDataToSend.append("isActive", true.toString());

      if (editingId) {
        setCoffeeItems((prev) =>
          prev.map((x) => (x.id === editingId ? item : x)),
        );
      } else {
        try {
          setIsLoading(true);
          await createMenuItem(formDataToSend);
          setPageAlert({
            visible: true,
            variant: "success",
            title: "Menu Item Created",
            description: "The menu item has been created successfully.",
          });
        } catch (error) {
          setPageAlert({
            visible: true,
            variant: "error",
            title: "Error Creating Menu Item",
            description: "An error occurred while creating the menu item.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      const item: MealItem = {
        id: editingId ?? Date.now(),
        name: formData.name,
        image: formData.imagePreview,
        price: Number(formData.price),
        description: formData.description,
        facts: formData.facts,
        includes: formData.includes,
        preparationTimeInMinutes: Number(
          formData.preparationTimeInMinutes || 0,
        ),
        portion: formData.portion,
      };

      const formDataToSend = new FormData();
      formDataToSend.append("name", item.name);
      formDataToSend.append("price", item.price.toString());
      formDataToSend.append("description", item.description);
      formDataToSend.append("facts", item.facts);
      formDataToSend.append("ingredients", item.includes.join(","));
      formDataToSend.append("image", formData.image || new Blob());
      formDataToSend.append("category", "1");
      formDataToSend.append(
        "preparationTimeInMinutes",
        item.preparationTimeInMinutes.toString(),
      );
      formDataToSend.append("portionSize", item.portion || "0");
      formDataToSend.append("isActive", true.toString());

      if (editingId) {
        setMealItems((prev) =>
          prev.map((x) => (x.id === editingId ? item : x)),
        );
      } else {
        try {
          setIsLoading(true);
          await createMenuItem(formDataToSend);
          setPageAlert({
            visible: true,
            variant: "success",
            title: "Menu Item Created",
            description: "The menu item has been created successfully.",
          });
        } catch (error) {
          setPageAlert({
            visible: true,
            variant: "error",
            title: "Error Creating Menu Item",
            description: "An error occurred while creating the menu item.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    closeModal();
  };

  const deleteCoffeeItem = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setCoffeeItems((prev) => prev.filter((x) => x.id !== id));
  };

  const deleteMealItem = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setMealItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <main className="min-h-screen">
      {/* Loading */}

      {isLoading &&
        createPortal(
          <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />

              <p className="text-sm font-medium text-white">
                loading, please wait...
              </p>
            </div>
          </div>,
          document.body,
        )}

      {pageAlert.visible &&
        createPortal(
          <div className="fixed right-4 top-4 z-[99999] w-[calc(100%-2rem)] max-w-md">
            <CustomAlert
              alert={pageAlert}
              onClose={() =>
                setPageAlert((previous) => ({
                  ...previous,
                  visible: false,
                }))
              }
            />
          </div>,
          document.body,
        )}

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-[#7A3E18] text-white shadow-sm">
              <Coffee size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#4A2410]">
                Menu Management
              </h1>

              <p className="text-sm text-[#8A5A3C]">
                Manage coffee, breakfast and other meal items
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#7A3E18] px-5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-7 rounded-2xl border border-amber-200/70 bg-white/80 p-2 shadow-sm backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("coffee");
                setSearch("");
                loadMenuItems(4);
              }}
              className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "coffee"
                  ? "bg-gradient-to-r from-amber-500 to-[#7A3E18] text-white shadow-sm"
                  : "text-[#6B422B] hover:bg-amber-50"
              }`}
            >
              <Coffee size={18} />
              Coffee Items
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("meals");
                setSearch("");
                loadMenuItems(1);
              }}
              className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "meals"
                  ? "bg-gradient-to-r from-amber-500 to-[#7A3E18] text-white shadow-sm"
                  : "text-[#6B422B] hover:bg-amber-50"
              }`}
            >
              <Utensils size={18} />
              Breakfast & Other Meals
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[#4A2410]">
                {activeTab === "coffee"
                  ? "Coffee Items"
                  : "Breakfast & Other Meals"}
              </h2>

              <p className="mt-0.5 text-xs text-[#9A6A4A]">
                {activeTab === "coffee"
                  ? `${coffeeItems.length} coffee item${
                      coffeeItems.length !== 1 ? "s" : ""
                    }`
                  : `${mealItems.length} meal item${
                      mealItems.length !== 1 ? "s" : ""
                    }`}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A4775C]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="h-11 w-full rounded-xl border border-amber-200 bg-white pl-10 pr-4 text-sm text-[#4A2410] outline-none transition placeholder:text-[#B9957E] focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            {activeTab === "coffee" ? (
              <CoffeeTable
                items={filteredCoffeeItems}
                onEdit={openEditModal}
                onDelete={deleteCoffeeItem}
              />
            ) : (
              <MealTable
                items={filteredMealItems}
                onEdit={openEditModal}
                onDelete={deleteMealItem}
              />
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {activeTab === "coffee" ? (
              <CoffeeMobileCards
                items={filteredCoffeeItems}
                onEdit={openEditModal}
                onDelete={deleteCoffeeItem}
              />
            ) : (
              <MealMobileCards
                items={filteredMealItems}
                onEdit={openEditModal}
                onDelete={deleteMealItem}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2D160A]/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-amber-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-[#7A3E18]">
                    {activeTab === "coffee" ? (
                      <Coffee size={20} />
                    ) : (
                      <Utensils size={20} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[#4A2410]">
                      {editingId ? "Edit Menu Item" : "Add Menu Item"}
                    </h2>

                    <p className="text-xs text-[#9A6A4A]">
                      {activeTab === "coffee"
                        ? "Add a coffee item"
                        : "Add a breakfast or meal item"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#8A5A3C] transition hover:bg-amber-50 hover:text-[#7A3E18]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="overflow-y-auto">
                <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
                  {/* Left */}
                  <div className="space-y-5">
                    <FormField label="Name" required>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder={
                          activeTab === "coffee"
                            ? "e.g. Cappuccino"
                            : "e.g. English Breakfast"
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField label="Price" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A5A3C]">
                            LKR
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            placeholder="0.00"
                            className={`${inputClass} pl-14`}
                          />
                        </div>
                      </FormField>

                      {activeTab === "meals" && (
                        <FormField label="Portion" required>
                          <input
                            type="text"
                            value={formData.portion}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                portion: e.target.value,
                              }))
                            }
                            placeholder="e.g. 1 person"
                            className={inputClass}
                          />
                        </FormField>
                      )}
                    </div>

                    <FormField label="Description">
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Describe this menu item..."
                        className={textareaClass}
                      />
                    </FormField>

                    <FormField label="Facts">
                      <textarea
                        rows={3}
                        value={formData.facts}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facts: e.target.value,
                          }))
                        }
                        placeholder="Interesting facts about this item..."
                        className={textareaClass}
                      />
                    </FormField>

                    {/* Coffee Ingredients */}
                    {activeTab === "coffee" && (
                      <FormField label="Ingredients">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setShowIngredientDropdown((prev) => !prev)
                            }
                            className="flex min-h-11 w-full items-center cursor-pointer justify-between rounded-xl border border-amber-200 bg-white px-3 text-left text-sm text-[#5B321D] outline-none transition hover:border-amber-400 focus:border-amber-500"
                          >
                            <div className="flex flex-wrap gap-1.5">
                              {formData.ingredients.length === 0 ? (
                                <span className="text-[#B9957E]">
                                  Select ingredients...
                                </span>
                              ) : (
                                formData.ingredients.map((ingredient) => (
                                  <span
                                    key={ingredient}
                                    className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-[#7A3E18]"
                                  >
                                    {ingredient}
                                  </span>
                                ))
                              )}
                            </div>

                            <ChevronDown size={17} />
                          </button>

                          {showIngredientDropdown && (
                            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-amber-200 bg-white p-2 shadow-xl">
                              {ingredientOptions.map((ingredient) => {
                                const selected =
                                  formData.ingredients.includes(ingredient);

                                return (
                                  <button
                                    key={ingredient}
                                    type="button"
                                    onClick={() => toggleIngredient(ingredient)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-[#5B321D] hover:bg-amber-50"
                                  >
                                    {ingredient}

                                    {selected && (
                                      <Check
                                        size={16}
                                        className="text-[#7A3E18]"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </FormField>
                    )}

                    {/* Meal Includes */}
                    {activeTab === "meals" && (
                      <>
                        <FormField label="Includes">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={includeText}
                              onChange={(e) => setIncludeText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addInclude();
                                }
                              }}
                              placeholder="e.g. Toast with butter"
                              className={inputClass}
                            />

                            <button
                              type="button"
                              onClick={addInclude}
                              className="flex h-11 cursor-pointer shrink-0 items-center gap-1.5 rounded-xl bg-amber-100 px-4 text-sm font-semibold text-[#7A3E18] hover:bg-amber-200"
                            >
                              <Plus size={16} />
                              Add
                            </button>
                          </div>

                          {formData.includes.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {formData.includes.map((include, index) => (
                                <div
                                  key={index}
                                  className="flex items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5"
                                >
                                  <div className="flex gap-2 text-sm text-[#6B422B]">
                                    <span className="font-semibold text-[#A45C27]">
                                      {index + 1}.
                                    </span>

                                    <span>{include}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeInclude(index)}
                                    className="shrink-0 cursor-pointer text-[#B56A50] hover:text-red-600"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </FormField>

                        <FormField label="Preparation Time" required>
                          <div className="relative">
                            <Clock
                              size={17}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A4775C]"
                            />

                            <input
                              type="number"
                              min="0"
                              value={formData.preparationTimeInMinutes}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  preparationTimeInMinutes: e.target.value,
                                }))
                              }
                              placeholder="e.g. 15"
                              className={`${inputClass} pl-10 pr-20`}
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#9A6A4A]">
                              minutes
                            </span>
                          </div>
                        </FormField>
                      </>
                    )}
                  </div>

                  {/* Image */}
                  <div>
                    <FormField label="Image">
                      <label className="group flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 transition hover:border-amber-400 hover:bg-amber-50">
                        {formData.imagePreview ? (
                          <div className="relative h-full min-h-[280px] w-full">
                            <img
                              src={formData.imagePreview}
                              alt="Preview"
                              className="h-full min-h-[280px] w-full object-cover"
                            />

                            <div className="absolute inset-0 flex items-center justify-center bg-[#2D160A]/40 opacity-0 transition group-hover:opacity-100">
                              <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#7A3E18]">
                                Change Image
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-[#7A3E18]">
                              <ImageIcon size={25} />
                            </div>

                            <p className="text-sm font-semibold text-[#6B422B]">
                              Upload Image
                            </p>

                            <p className="mt-1 text-xs text-[#A4775C]">
                              PNG, JPG or WEBP
                            </p>
                          </>
                        )}

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </FormField>

                    {activeTab === "meals" && (
                      <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#7A3E18]">
                            <Utensils size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#5B321D]">
                              Meal Information
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#9A6A4A]">
                              Add the portion size, preparation time and
                              individual items included with this meal.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "coffee" &&
                      formData.ingredients.length > 0 && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                          <p className="text-sm font-semibold text-[#5B321D]">
                            Selected Ingredients
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {formData.ingredients.map((ingredient) => (
                              <span
                                key={ingredient}
                                className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-[#7A3E18] shadow-sm ring-1 ring-amber-100"
                              >
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-amber-100 bg-amber-50/40 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-11 cursor-pointer rounded-xl border border-amber-200 bg-white px-5 text-sm font-semibold text-[#6B422B] transition hover:bg-amber-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="h-11 cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-[#7A3E18] px-6 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                  >
                    {editingId ? "Update Item" : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}

function CustomAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${styles[alert.variant]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{alert.title}</p>

        <p className="mt-1 text-sm opacity-80">{alert.description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5"
      >
        <X size={17} />
      </button>
    </div>
  );
}

/* =========================================================
   TABLES
========================================================= */

function CoffeeTable({
  items,
  onEdit,
  onDelete,
}: {
  items: CoffeeItem[];
  onEdit: (item: CoffeeItem) => void;
  onDelete: (id: number) => void;
}) {
  if (items.length === 0) {
    return <EmptyState type="coffee" />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-amber-100 bg-amber-50/40">
          <th className={thClass}>Item</th>
          <th className={thClass}>Price</th>
          <th className={thClass}>Ingredients</th>
          <th className={thClass}>Description</th>
          <th className={`${thClass} text-right`}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className="border-b border-amber-50 transition hover:bg-amber-50/40"
          >
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={getBase64ImageSrc(item.image)}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-[#7A3E18]">
                    <Coffee size={20} />
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-[#4A2410]">
                    {item.name}
                  </p>

                  <p className="text-xs text-[#A4775C]">Coffee</p>
                </div>
              </div>
            </td>

            <td className="px-5 py-4">
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-semibold text-emerald-700">
                LKR {item.price.toLocaleString()}
              </span>
            </td>

            <td className="max-w-xs px-5 py-4">
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.slice(0, 3).map((x) => (
                  <span
                    key={x}
                    className="rounded-md bg-amber-50 px-2 py-1 text-xs text-[#7A3E18]"
                  >
                    {x}
                  </span>
                ))}

                {item.ingredients.length > 3 && (
                  <span className="text-xs text-[#A4775C]">
                    +{item.ingredients.length - 3}
                  </span>
                )}
              </div>
            </td>

            <td className="max-w-sm px-5 py-4">
              <p className="truncate text-sm text-[#79543C]">
                {item.description || "—"}
              </p>
            </td>

            <td className="px-5 py-4">
              <ActionButtons
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MealTable({
  items,
  onEdit,
  onDelete,
}: {
  items: MealItem[];
  onEdit: (item: MealItem) => void;
  onDelete: (id: number) => void;
}) {
  if (items.length === 0) {
    return <EmptyState type="meal" />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-amber-100 bg-amber-50/40">
          <th className={thClass}>Item</th>
          <th className={thClass}>Price</th>
          <th className={thClass}>Preparation</th>
          <th className={thClass}>Portion</th>
          <th className={thClass}>Description</th>
          <th className={`${thClass} text-right`}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className="border-b border-amber-50 transition hover:bg-amber-50/40"
          >
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={getBase64ImageSrc(item.image)}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-[#7A3E18]">
                    <Utensils size={20} />
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-[#4A2410]">
                    {item.name}
                  </p>

                  <p className="text-xs text-[#A4775C]">Meal</p>
                </div>
              </div>
            </td>

            <td className="px-5 py-4">
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-semibold text-emerald-700">
                LKR {item.price.toLocaleString()}
              </span>
            </td>

            <td className="px-5 py-4">
              <div className="flex items-center gap-1.5 text-sm text-[#6B422B]">
                <Clock size={15} />
                {item.preparationTimeInMinutes} min
              </div>
            </td>

            <td className="px-5 py-4">
              <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-[#7A3E18]">
                {item.portion || "—"}
              </span>
            </td>

            <td className="max-w-sm px-5 py-4">
              <p className="truncate text-sm text-[#79543C]">
                {item.description || "—"}
              </p>
            </td>

            <td className="px-5 py-4">
              <ActionButtons
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* =========================================================
   MOBILE CARDS
========================================================= */

function CoffeeMobileCards({
  items,
  onEdit,
  onDelete,
}: {
  items: CoffeeItem[];
  onEdit: (item: CoffeeItem) => void;
  onDelete: (id: number) => void;
}) {
  if (items.length === 0) {
    return <EmptyState type="coffee" />;
  }

  return (
    <div className="divide-y divide-amber-100">
      {items.map((item) => (
        <div key={item.id} className="p-4">
          <div className="flex gap-3">
            {item.image ? (
              <img
                src={getBase64ImageSrc(item.image)}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#7A3E18]">
                <Coffee size={22} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="truncate text-sm font-semibold text-[#4A2410]">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    LKR {item.price.toLocaleString()}
                  </p>
                </div>

                <ActionButtons
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item.id)}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.ingredients.map((x) => (
                  <span
                    key={x}
                    className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-[#7A3E18]"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {item.description && (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#79543C]">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MealMobileCards({
  items,
  onEdit,
  onDelete,
}: {
  items: MealItem[];
  onEdit: (item: MealItem) => void;
  onDelete: (id: number) => void;
}) {
  if (items.length === 0) {
    return <EmptyState type="meal" />;
  }

  return (
    <div className="divide-y divide-amber-100">
      {items.map((item) => (
        <div key={item.id} className="p-4">
          <div className="flex gap-3">
            {item.image ? (
              <img
                src={getBase64ImageSrc(item.image)}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#7A3E18]">
                <Utensils size={22} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="truncate text-sm font-semibold text-[#4A2410]">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    LKR {item.price.toLocaleString()}
                  </p>
                </div>

                <ActionButtons
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item.id)}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-[#7A3E18]">
                  {item.preparationTimeInMinutes} min
                </span>

                <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-[#7A3E18]">
                  {item.portion || "—"}
                </span>
              </div>
            </div>
          </div>

          {item.description && (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#79543C]">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function ActionButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8A5A3C] transition hover:bg-amber-100 hover:text-[#7A3E18]"
        title="Edit"
      >
        <Edit size={16} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#A4775C] transition hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function EmptyState({ type }: { type: "coffee" | "meal" }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-[#7A3E18]">
        {type === "coffee" ? <Coffee size={25} /> : <Utensils size={25} />}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#4A2410]">
        No menu items found
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[#9A6A4A]">
        Add your first {type === "coffee" ? "coffee item" : "meal item"} to get
        started.
      </p>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5B321D]">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-[#4A2410] outline-none transition placeholder:text-[#B9957E] focus:border-amber-500 focus:ring-4 focus:ring-amber-100";

const textareaClass =
  "w-full rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm text-[#4A2410] outline-none transition placeholder:text-[#B9957E] focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none";

const thClass =
  "px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#9A6A4A]";
