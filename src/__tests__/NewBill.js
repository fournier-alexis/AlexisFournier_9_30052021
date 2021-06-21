import NewBillUI from "../views/NewBillUI.js";
import { screen, fireEvent } from "@testing-library/dom";
import NewBill from "../containers/NewBill";
import { localStorageMock } from "../__mocks__/localStorage";
import { ROUTES } from "../constants/routes";
import userEvent from "@testing-library/user-event";
import firebase from "../__mocks__/firebase";
import DashboardUI from "../views/DashboardUI";
import BillsUI from "../views/BillsUI";

jest.mock("../app/Firestore");

describe("Given I am connected as an employee", () => {
  let onNavigate;
  let newBill;
  beforeEach(async () => {
    $.fn.modal = jest.fn();
    document.body.innerHTML = NewBillUI();
    onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "test@test.test",
      })
    );
    newBill = new NewBill({
      document,
      onNavigate,
      firestore: undefined,
      localStorage: window.localStorage,
    });
  });

  describe("When I am on NewBill Page", () => {
    test("Then i should see the complete form ", () => {
      expect(screen.getByTestId("form-new-bill")).toMatchSnapshot();
    });
    test("I should have all choice in the type select box", () => {
      expect(screen.getAllByRole("option").length).toEqual(7);
    });

    describe("When I chose a file as justify", () => {
      test("I should see the file selected", () => {
        const handleChangeFile = jest.fn(newBill.handleChangeFile);

        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [new File(["test.jpg"], "test.jpg", { type: "image/jpeg" })],
          },
        });

        expect(handleChangeFile).toHaveBeenCalledTimes(1);
        expect(file.files[0].name).toBe("test.jpg");
      });
      test("I should have an error", () => {
        jest.spyOn(window, "alert").mockImplementation(() => {});
        const handleChangeFile = jest.fn(newBill.handleChangeFile);

        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [new File(["test.txt"], "test.txt", { type: "text/txt" })],
          },
        });

        expect(window.alert).toBeCalled();
      });
    });
    describe("When i send the form", () => {
      test("I should be redirect to the bill page", () => {
        newBill = new NewBill({
          document,
          onNavigate,
          firestore: undefined,
          localStorage,
        });
        screen.getByTestId("expense-type").value = "Transports";
        screen.getByTestId("expense-name").value = "test bill";
        screen.getByTestId("amount").value = "10";
        screen.getByTestId("datepicker").value = "2021-06-07";
        screen.getByTestId("vat").value = "";
        screen.getByTestId("pct").value = "20";
        screen.getByTestId("commentary").value = "test commentary";
        const handleSubmit = jest.fn(newBill.handleSubmit);
        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("click", handleSubmit);
        userEvent.click(form);
        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    });

    // test d'intégration Post
    describe("When I create a new bill", () => {
      const bill = {
        email: "test@test.test",
        type: "Transports",
        name: "test",
        amount: 0,
        date: Date.now(),
        vat: 0,
        pct: 20,
        commentary: "",
        fileUrl: "",
        fileName: "",
        status: "pending",
      };

      test("create a new bill POST", async () => {
        const postSpy = jest.spyOn(firebase, "post");
        const bills = await firebase.post(bill);
        expect(postSpy).toHaveBeenCalledTimes(1);
        expect(bills.data.length).toEqual(5);
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        );
        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        );
        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
