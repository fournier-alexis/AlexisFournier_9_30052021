import { screen } from "@testing-library/dom";
import Bills from "../containers/Bills";
import "@testing-library/jest-dom/extend-expect";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsUI, { antiChrono } from "../views/BillsUI.js";
import userEvent from "@testing-library/user-event";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { bill } from "../fixtures/bills.js";
import Router from "../app/Router";
import Firestore from "../app/Firestore";

describe("Given I am connected as an employee", () => {
  let onNavigate;
  let bills;
  beforeEach(() => {
    $.fn.modal = jest.fn();
    document.body.innerHTML = BillsUI({ data: bill });
    onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    bills = new Bills({
      document,
      onNavigate,
      firestore: undefined,
      localStorage,
    });
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      jest.mock("../app/Firestore");
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });
      const pathname = ROUTES_PATH["Bills"];
      Object.defineProperty(window, "location", { value: { hash: pathname } });
      document.body.innerHTML = `<div id="root"></div>`;
      Router();
      expect(screen.getByTestId("icon-window").className).toContain(
        "active-icon"
      );
    });

    test("Then bills should be ordered from earliest to latest", () => {
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When i click on the eye icon", () => {
    test("I should see the justificatory", () => {
      const handleClick = jest.fn(bills.handleClickIconEye);
      const eye = screen.getAllByTestId("icon-eye");

      eye.forEach((e) => {
        e.addEventListener("click", () => {
          handleClick(e);
        });
      });
      userEvent.click(eye[0]);
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(eye[0]);
      expect(screen.getByTestId("modal-justificatif")).toBeTruthy();
    });
  });

  describe("When i click to add a new bill", () => {
    test("I should be redirected to the new bill page", () => {
      const handleClick = jest.fn(bills.handleClickNewBill);
      const btnNewBill = screen.getByTestId("btn-new-bill");

      btnNewBill.addEventListener("click", handleClick);
      userEvent.click(btnNewBill);
      expect(handleClick).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
});
